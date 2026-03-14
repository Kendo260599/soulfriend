/**
 * EVENT QUEUE SERVICE
 * 
 * V5 Infrastructure — Event-driven architecture
 * In-memory event queue (upgradeable to Kafka/RabbitMQ)
 * Decouples interaction capture from evaluation pipeline
 * 
 * @module services/eventQueueService
 * @version 5.0.0
 */

import { EventEmitter } from 'events';
import { logger } from '../utils/logger';

type EventType = 
  | 'interaction.captured'
  | 'evaluation.completed'
  | 'feedback.received'
  | 'expert_review.submitted'
  | 'training_data.curated'
  | 'model.improved'
  | 'experiment.started'
  | 'experiment.completed'
  | 'crisis.detected'
  | 'guardrail.violated'
  | 'ebh.warning';

interface QueueEvent {
  id: string;
  type: EventType;
  data: any;
  timestamp: Date;
  retries: number;
}

class EventQueueService extends EventEmitter {
  private queue: QueueEvent[] = [];
  private processing = false;
  private handlers: Map<EventType, Array<(data: any) => Promise<void>>> = new Map();
  private stats = {
    totalEvents: 0,
    processedEvents: 0,
    failedEvents: 0,
    lastProcessed: null as Date | null,
  };

  constructor() {
    super();
    this.setMaxListeners(50);
  }

  /**
   * Publish event vào queue
   */
  async publish(type: EventType, data: any): Promise<void> {
    const event: QueueEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      type,
      data,
      timestamp: new Date(),
      retries: 0,
    };

    this.queue.push(event);
    this.stats.totalEvents++;

    // Emit for real-time listeners
    this.emit(type, data);

    // Process queue if not already processing
    if (!this.processing) {
      await this.processQueue();
    }
  }

  /**
   * Subscribe handler cho event type
   */
  subscribe(type: EventType, handler: (data: any) => Promise<void>): void {
    const hasType = this.handlers.has(type);
    if (!hasType) {
      this.handlers.set(type, []);
    }
    this.handlers.get(type)!.push(handler);
    if (!hasType) {
      logger.info(`[EventQueue] Subscribed handler for ${type}`);
    }
  }

  /**
   * Process queued events
   */
  private async processQueue(): Promise<void> {
    if (this.processing) return;
    this.processing = true;

    while (this.queue.length > 0) {
      const event = this.queue.shift()!;
      const handlers = this.handlers.get(event.type) || [];

      for (const handler of handlers) {
        try {
          await handler(event.data);
          this.stats.processedEvents++;
          this.stats.lastProcessed = new Date();
        } catch (error) {
          event.retries++;
          if (event.retries < 3) {
            this.queue.push(event); // Retry
            logger.warn(`[EventQueue] Retrying event ${event.id} (attempt ${event.retries})`);
          } else {
            this.stats.failedEvents++;
            logger.error(`[EventQueue] Event ${event.id} failed after 3 retries:`, error);
          }
        }
      }
    }

    this.processing = false;
  }

  /**
   * Get queue stats
   */
  getStats(): any {
    return {
      ...this.stats,
      queueLength: this.queue.length,
      registeredHandlers: Object.fromEntries(
        Array.from(this.handlers.entries()).map(([k, v]) => [k, v.length])
      ),
    };
  }
}

export const eventQueueService = new EventQueueService();
export default eventQueueService;
