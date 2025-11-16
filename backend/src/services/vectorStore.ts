/**
 * 🔍 Vector Store Service - Pinecone Integration
 * Handles embedding creation and vector storage
 */

import { Pinecone } from '@pinecone-database/pinecone';
import { OpenAIEmbeddings } from '@langchain/openai';
import config from '../config/environment';

export interface VectorMetadata {
  userId: string;
  type: 'insight' | 'pattern' | 'preference' | 'milestone' | 'conversation';
  content: string;
  timestamp: number;
  category?: string;
  confidence?: number;
  [key: string]: any;
}

export interface VectorSearchResult {
  id: string;
  score: number;
  metadata: VectorMetadata;
}

export class VectorStore {
  private pinecone: Pinecone | null = null;
  private embeddings: OpenAIEmbeddings | null = null;
  private indexName: string;
  private initialized: boolean = false;
  private enabled: boolean = false;

  constructor() {
    this.indexName = config.PINECONE_INDEX_NAME || 'soulfriend-memories';
    
    // Check if Pinecone is configured
    this.enabled = !!(config.PINECONE_API_KEY && config.OPENAI_API_KEY);

    if (!this.enabled) {
      console.log('⚠️  Pinecone not configured, vector memory disabled');
      return;
    }

    try {
      // Initialize Pinecone client
      this.pinecone = new Pinecone({
        apiKey: config.PINECONE_API_KEY!,
      });

      // Initialize OpenAI embeddings
      this.embeddings = new OpenAIEmbeddings({
        openAIApiKey: config.OPENAI_API_KEY!,
        modelName: 'text-embedding-3-small', // Fast & cheap (1536 dimensions)
      });

      console.log('✅ Pinecone client initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Pinecone client:', error);
      this.enabled = false;
    }
  }

  /**
   * Check if Pinecone is enabled
   */
  isEnabled(): boolean {
    return this.enabled && this.initialized;
  }

  /**
   * Initialize connection to Pinecone index
   */
  async initialize(): Promise<void> {
    if (!this.enabled || !this.pinecone) {
      console.log('⚠️  Pinecone disabled, skipping initialization');
      return;
    }

    try {
      // Check if index exists
      const indexes = await this.pinecone.listIndexes();
      const indexExists = indexes.indexes?.some(idx => idx.name === this.indexName);

      if (!indexExists) {
        console.log(`📊 Creating Pinecone index: ${this.indexName}...`);
        
        // Create index with appropriate dimensions for text-embedding-3-small (1536)
        await this.pinecone.createIndex({
          name: this.indexName,
          dimension: 1536,
          metric: 'cosine',
          spec: {
            serverless: {
              cloud: 'aws',
              region: config.PINECONE_ENVIRONMENT || 'us-east-1',
            },
          },
        });

        console.log('✅ Pinecone index created successfully');
        
        // Wait for index to be ready
        await this.waitForIndexReady();
      } else {
        console.log(`✅ Pinecone index "${this.indexName}" already exists`);
      }

      this.initialized = true;
    } catch (error) {
      console.error('❌ Failed to initialize Pinecone:', error);
      this.enabled = false;
      throw error;
    }
  }

  /**
   * Wait for index to be ready
   */
  private async waitForIndexReady(maxAttempts = 30): Promise<void> {
    if (!this.pinecone) return;

    for (let i = 0; i < maxAttempts; i++) {
      try {
        const indexStats = await this.pinecone.index(this.indexName).describeIndexStats();
        if (indexStats) {
          console.log('✅ Pinecone index is ready');
          return;
        }
      } catch (error) {
        console.log(`⏳ Waiting for index to be ready... (${i + 1}/${maxAttempts})`);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s
      }
    }
    throw new Error('Timeout waiting for Pinecone index to be ready');
  }

  /**
   * Create embedding from text
   */
  async createEmbedding(text: string): Promise<number[]> {
    if (!this.embeddings) {
      throw new Error('Embeddings not initialized');
    }

    try {
      const embedding = await this.embeddings.embedQuery(text);
      return embedding;
    } catch (error) {
      console.error('❌ Failed to create embedding:', error);
      throw error;
    }
  }

  /**
   * Upsert vector to Pinecone
   */
  async upsert(vector: {
    id: string;
    values: number[];
    metadata: VectorMetadata;
  }): Promise<void> {
    if (!this.enabled) {
      console.log('⚠️  Pinecone disabled, skipping upsert');
      return;
    }

    if (!this.initialized) {
      await this.initialize();
    }

    if (!this.pinecone) {
      throw new Error('Pinecone not initialized');
    }

    try {
      const index = this.pinecone.index(this.indexName);
      await index.upsert([vector]);
      console.log(`✅ Vector upserted: ${vector.id}`);
    } catch (error) {
      console.error('❌ Failed to upsert vector:', error);
      throw error;
    }
  }

  /**
   * Batch upsert vectors
   */
  async batchUpsert(vectors: Array<{
    id: string;
    values: number[];
    metadata: VectorMetadata;
  }>): Promise<void> {
    if (!this.enabled) {
      console.log('⚠️  Pinecone disabled, skipping batch upsert');
      return;
    }

    if (!this.initialized) {
      await this.initialize();
    }

    if (!this.pinecone) {
      throw new Error('Pinecone not initialized');
    }

    try {
      const index = this.pinecone.index(this.indexName);
      
      // Upsert in batches of 100 (Pinecone limit)
      const batchSize = 100;
      for (let i = 0; i < vectors.length; i += batchSize) {
        const batch = vectors.slice(i, i + batchSize);
        await index.upsert(batch);
        console.log(`✅ Batch ${Math.floor(i / batchSize) + 1} upserted (${batch.length} vectors)`);
      }
    } catch (error) {
      console.error('❌ Failed to batch upsert vectors:', error);
      throw error;
    }
  }

  /**
   * Query similar vectors (semantic search)
   */
  async query(params: {
    vector: number[];
    filter?: Record<string, any>;
    topK?: number;
    includeMetadata?: boolean;
  }): Promise<VectorSearchResult[]> {
    if (!this.enabled) {
      console.log('⚠️  Pinecone disabled, returning empty results');
      return [];
    }

    if (!this.initialized) {
      await this.initialize();
    }

    if (!this.pinecone) {
      throw new Error('Pinecone not initialized');
    }

    try {
      const index = this.pinecone.index(this.indexName);
      const queryResponse = await index.query({
        vector: params.vector,
        filter: params.filter,
        topK: params.topK || 5,
        includeMetadata: params.includeMetadata !== false,
      });

      return (queryResponse.matches || []).map(match => ({
        id: match.id,
        score: match.score || 0,
        metadata: match.metadata as VectorMetadata,
      }));
    } catch (error) {
      console.error('❌ Failed to query vectors:', error);
      throw error;
    }
  }

  /**
   * Delete vectors by IDs
   */
  async delete(ids: string[]): Promise<void> {
    if (!this.enabled) {
      console.log('⚠️  Pinecone disabled, skipping delete');
      return;
    }

    if (!this.initialized) {
      await this.initialize();
    }

    if (!this.pinecone) {
      throw new Error('Pinecone not initialized');
    }

    try {
      const index = this.pinecone.index(this.indexName);
      await index.deleteMany(ids);
      console.log(`✅ Deleted ${ids.length} vectors`);
    } catch (error) {
      console.error('❌ Failed to delete vectors:', error);
      throw error;
    }
  }

  /**
   * Delete all vectors for a user (GDPR compliance)
   */
  async deleteByUser(userId: string): Promise<void> {
    if (!this.enabled) {
      console.log('⚠️  Pinecone disabled, skipping user delete');
      return;
    }

    if (!this.initialized) {
      await this.initialize();
    }

    if (!this.pinecone) {
      throw new Error('Pinecone not initialized');
    }

    try {
      const index = this.pinecone.index(this.indexName);
      await index.deleteMany({ userId });
      console.log(`✅ Deleted all vectors for user: ${userId}`);
    } catch (error) {
      console.error('❌ Failed to delete user vectors:', error);
      throw error;
    }
  }

  /**
   * Get index statistics
   */
  async getStats() {
    if (!this.enabled) {
      return { enabled: false };
    }

    if (!this.initialized) {
      await this.initialize();
    }

    if (!this.pinecone) {
      throw new Error('Pinecone not initialized');
    }

    try {
      const index = this.pinecone.index(this.indexName);
      const stats = await index.describeIndexStats();
      return { enabled: true, ...stats };
    } catch (error) {
      console.error('❌ Failed to get index stats:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const vectorStore = new VectorStore();
