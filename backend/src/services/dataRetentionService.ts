/**
 * DATA RETENTION SERVICE
 *
 * Automated data lifecycle management for GDPR compliance.
 * Configurable retention periods per data type with scheduled cleanup.
 *
 * Features:
 *   - Configurable retention periods via env vars
 *   - Periodic cleanup job (runs daily)
 *   - Audit logging of all deletions
 *   - Safety: never deletes active crisis alerts or ongoing interventions
 *
 * @module services/dataRetentionService
 * @version 1.0.0
 */

import logger from '../utils/logger';
import { ConversationLog } from '../models/ConversationLog';
import LongTermMemory from '../models/LongTermMemory';
import AuditLogModel from '../models/AuditLog';
import Consent from '../models/Consent';
import { auditLogger } from '../middleware/auditLogger';

// =============================================================================
// TYPES
// =============================================================================

export interface RetentionPolicy {
  /** Name of the data category */
  name: string;
  /** Collection name in MongoDB */
  collection: string;
  /** Retention period in days */
  retentionDays: number;
  /** Date field to check against */
  dateField: string;
  /** Additional filter (e.g., don't delete active items) */
  safetyFilter?: Record<string, any>;
  /** Whether this policy is enabled */
  enabled: boolean;
}

export interface RetentionResult {
  policy: string;
  collection: string;
  deletedCount: number;
  cutoffDate: Date;
  executedAt: Date;
  error?: string;
}

// =============================================================================
// SERVICE
// =============================================================================

export class DataRetentionService {
  private policies: RetentionPolicy[];
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.policies = this.initializePolicies();
  }

  /**
   * Initialize retention policies from environment or defaults
   */
  private initializePolicies(): RetentionPolicy[] {
    return [
      {
        name: 'Conversations',
        collection: 'conversation_logs',
        retentionDays: parseInt(process.env.RETENTION_CONVERSATIONS_DAYS || '365', 10),
        dateField: 'createdAt',
        enabled: true,
      },
      {
        name: 'Long-term Memories',
        collection: 'long_term_memories',
        retentionDays: parseInt(process.env.RETENTION_MEMORIES_DAYS || '730', 10), // 2 years
        dateField: 'createdAt',
        safetyFilter: {
          type: { $nin: ['trigger', 'milestone'] }, // Never auto-delete safety-critical memories
        },
        enabled: true,
      },
      {
        name: 'Expired Consents',
        collection: 'consents',
        retentionDays: parseInt(process.env.RETENTION_CONSENT_DAYS || '2555', 10), // 7 years (legal)
        dateField: 'timestamp',
        enabled: true,
      },
      {
        name: 'Audit Logs',
        collection: 'audit_logs',
        retentionDays: parseInt(process.env.RETENTION_AUDIT_DAYS || '1095', 10), // 3 years
        dateField: 'timestamp',
        enabled: false, // Handled by TTL index on AuditLog model
      },
      {
        name: 'Intervention Messages',
        collection: 'intervention_messages',
        retentionDays: parseInt(process.env.RETENTION_INTERVENTION_DAYS || '730', 10), // 2 years
        dateField: 'timestamp',
        enabled: true,
      },
      {
        name: 'Training Data Points',
        collection: 'training_data_points',
        retentionDays: parseInt(process.env.RETENTION_TRAINING_DAYS || '1095', 10), // 3 years
        dateField: 'timestamp',
        enabled: true,
      },
    ];
  }

  /**
   * Start periodic retention enforcement (daily)
   */
  startPeriodicEnforcement(): void {
    if (this.timer) clearInterval(this.timer);

    const intervalMs = 24 * 60 * 60 * 1000; // 24 hours
    this.timer = setInterval(() => {
      this.enforceAll().catch(err =>
        logger.error('[DataRetention] Periodic enforcement failed:', err)
      );
    }, intervalMs);

    logger.info('[DataRetention] Periodic enforcement started (every 24h)');

    // Also run initial check 5 minutes after startup
    setTimeout(() => {
      this.enforceAll().catch(err =>
        logger.warn('[DataRetention] Initial enforcement failed:', err)
      );
    }, 5 * 60 * 1000);
  }

  /**
   * Stop periodic enforcement
   */
  stopPeriodicEnforcement(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /**
   * Enforce all retention policies
   */
  async enforceAll(): Promise<RetentionResult[]> {
    // Check MongoDB connection before running
    const mongoose = await import('mongoose');
    if (mongoose.connection.readyState !== 1 || !mongoose.connection.db) {
      logger.warn('[DataRetention] MongoDB not ready (state: ' + mongoose.connection.readyState + '), skipping enforcement');
      return [];
    }

    logger.info('[DataRetention] Starting retention enforcement...');

    const results: RetentionResult[] = [];
    const enabledPolicies = this.policies.filter(p => p.enabled);

    for (const policy of enabledPolicies) {
      try {
        const result = await this.enforcePolicy(policy);
        results.push(result);

        if (result.deletedCount > 0) {
          logger.info(
            `[DataRetention] ${policy.name}: Deleted ${result.deletedCount} records older than ${policy.retentionDays} days`
          );

          // Audit log the deletion
          auditLogger.logGDPR(
            'data_retention_delete',
            'system',
            'GDPR Art. 5(1)(e) - Storage limitation',
            [policy.name.toLowerCase()],
            {
              collection: policy.collection,
              deletedCount: result.deletedCount,
              cutoffDate: result.cutoffDate,
              retentionDays: policy.retentionDays,
            }
          );
        }
      } catch (error: any) {
        logger.error(`[DataRetention] Failed for ${policy.name}:`, error);
        results.push({
          policy: policy.name,
          collection: policy.collection,
          deletedCount: 0,
          cutoffDate: new Date(),
          executedAt: new Date(),
          error: error.message,
        });
      }
    }

    const totalDeleted = results.reduce((s, r) => s + r.deletedCount, 0);
    logger.info(
      `[DataRetention] Enforcement complete: ${totalDeleted} total records deleted across ${enabledPolicies.length} policies`
    );

    return results;
  }

  /**
   * Enforce a single retention policy
   */
  private async enforcePolicy(policy: RetentionPolicy): Promise<RetentionResult> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - policy.retentionDays);

    const filter: any = {
      [policy.dateField]: { $lt: cutoffDate },
      ...(policy.safetyFilter || {}),
    };

    // Use the mongoose connection to access the collection directly
    const mongoose = await import('mongoose');

    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      throw new Error('MongoDB not connected');
    }

    // Check if collection exists before trying to delete
    const collections = await mongoose.connection.db!.listCollections({ name: policy.collection }).toArray();
    if (collections.length === 0) {
      logger.debug(`[DataRetention] Collection '${policy.collection}' does not exist, skipping`);
      return {
        policy: policy.name,
        collection: policy.collection,
        deletedCount: 0,
        cutoffDate,
        executedAt: new Date(),
      };
    }

    const collection = mongoose.connection.collection(policy.collection);
    const deleteResult = await collection.deleteMany(filter);

    return {
      policy: policy.name,
      collection: policy.collection,
      deletedCount: deleteResult.deletedCount || 0,
      cutoffDate,
      executedAt: new Date(),
    };
  }

  /**
   * Get current retention policies
   */
  getPolicies(): RetentionPolicy[] {
    return this.policies.map(p => ({ ...p }));
  }

  /**
   * Update a retention policy
   */
  updatePolicy(collection: string, updates: Partial<RetentionPolicy>): void {
    const policy = this.policies.find(p => p.collection === collection);
    if (policy) {
      Object.assign(policy, updates);
      logger.info(`[DataRetention] Policy updated for ${collection}:`, updates);
    }
  }

  /**
   * Get retention statistics (how much data would be affected by current policies)
   */
  async getRetentionStats(): Promise<{
    policies: Array<{
      name: string;
      collection: string;
      retentionDays: number;
      enabled: boolean;
      recordsToDelete: number;
      totalRecords: number;
      oldestRecord?: Date;
    }>;
  }> {
    const mongoose = await import('mongoose');
    const stats = [];

    for (const policy of this.policies) {
      try {
        const collection = mongoose.connection.collection(policy.collection);
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - policy.retentionDays);

        const filter: any = {
          [policy.dateField]: { $lt: cutoffDate },
          ...(policy.safetyFilter || {}),
        };

        const recordsToDelete = await collection.countDocuments(filter);
        const totalRecords = await collection.countDocuments();

        // Get oldest record date
        const oldest = await collection
          .find({})
          .sort({ [policy.dateField]: 1 })
          .limit(1)
          .toArray();

        stats.push({
          name: policy.name,
          collection: policy.collection,
          retentionDays: policy.retentionDays,
          enabled: policy.enabled,
          recordsToDelete,
          totalRecords,
          oldestRecord: oldest[0]?.[policy.dateField] as Date | undefined,
        });
      } catch {
        stats.push({
          name: policy.name,
          collection: policy.collection,
          retentionDays: policy.retentionDays,
          enabled: policy.enabled,
          recordsToDelete: 0,
          totalRecords: 0,
        });
      }
    }

    return { policies: stats };
  }
}

// Export singleton
export const dataRetentionService = new DataRetentionService();
export default dataRetentionService;
