/**
 * Redis Configuration for Caching and Session Management
 * Supports production-grade Redis Cloud and local development
 */

import { createClient, RedisClientType } from 'redis';
import config from './environment';

export class RedisConnection {
  private static instance: RedisConnection;
  private client: RedisClientType | null = null;
  private isConnected: boolean = false;

  private constructor() {}

  static getInstance(): RedisConnection {
    if (!RedisConnection.instance) {
      RedisConnection.instance = new RedisConnection();
    }
    return RedisConnection.instance;
  }

  /**
   * Connect to Redis server
   */
  async connect(): Promise<void> {
    if (this.isConnected && this.client) {
      console.log('📊 Already connected to Redis');
      return;
    }

    // Redis is optional - skip if not configured
    if (!config.REDIS_URL) {
      console.log('⚠️  Redis URL not configured - caching disabled');
      return;
    }

    try {
      console.log('🔄 Connecting to Redis...');

      // Check if URL uses TLS (rediss:// for Upstash, etc.)
      const usesTLS = config.REDIS_URL.startsWith('rediss://');
      
      // Build socket configuration based on protocol
      const socketConfig: any = {
        connectTimeout: 10000,
        reconnectStrategy: (retries: number) => {
          if (retries > 10) {
            console.error('❌ Redis reconnection failed after 10 attempts');
            return new Error('Redis reconnection limit reached');
          }
          const delay = Math.min(retries * 100, 3000);
          console.log(`🔄 Reconnecting to Redis in ${delay}ms (attempt ${retries})`);
          return delay;
        },
      };

      // Add TLS config for secure connections
      if (usesTLS) {
        socketConfig.tls = true;
        console.log('🔒 Using TLS/SSL for Redis connection');
      }

      this.client = createClient({
        url: config.REDIS_URL,
        socket: socketConfig,
      });

      // Event handlers
      this.client.on('error', (err: Error) => {
        console.error('❌ Redis client error:', err.message);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        console.log('🔄 Redis client connecting...');
      });

      this.client.on('ready', () => {
        console.log('✅ Redis connected successfully');
        this.isConnected = true;
      });

      this.client.on('reconnecting', () => {
        console.log('🔄 Redis reconnecting...');
        this.isConnected = false;
      });

      this.client.on('end', () => {
        console.log('⚠️  Redis connection closed');
        this.isConnected = false;
      });

      // Connect to Redis
      await this.client.connect();

      // Test connection
      await this.client.ping();
      console.log('✅ Redis PING successful');
    } catch (error) {
      console.error('❌ Redis connection failed:', error instanceof Error ? error.message : error);
      this.isConnected = false;
      this.client = null;
      // Don't throw - Redis is optional, app should continue without cache
    }
  }

  /**
   * Disconnect from Redis
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      try {
        await this.client.quit();
        console.log('✅ Redis disconnected gracefully');
      } catch (error) {
        console.error('❌ Error disconnecting from Redis:', error);
      } finally {
        this.client = null;
        this.isConnected = false;
      }
    }
  }

  /**
   * Get the Redis client instance
   */
  getClient(): RedisClientType | null {
    return this.client;
  }

  /**
   * Check if Redis is connected and healthy
   */
  isHealthy(): boolean {
    return this.isConnected && this.client !== null;
  }

  /**
   * Set a value in Redis with optional expiration
   * @param key - Cache key
   * @param value - Value to store (will be JSON stringified)
   * @param expirationSeconds - TTL in seconds (optional)
   */
  async set(key: string, value: any, expirationSeconds?: number): Promise<boolean> {
    if (!this.isHealthy() || !this.client) {
      console.warn('⚠️  Redis not available, skipping set operation');
      return false;
    }

    try {
      const serialized = JSON.stringify(value);
      if (expirationSeconds) {
        await this.client.setEx(key, expirationSeconds, serialized);
      } else {
        await this.client.set(key, serialized);
      }
      return true;
    } catch (error) {
      console.error('❌ Redis SET error:', error);
      return false;
    }
  }

  /**
   * Get a value from Redis
   * @param key - Cache key
   * @returns Parsed JSON value or null if not found
   */
  async get<T = any>(key: string): Promise<T | null> {
    if (!this.isHealthy() || !this.client) {
      console.warn('⚠️  Redis not available, skipping get operation');
      return null;
    }

    try {
      const value = await this.client.get(key);
      if (value === null) {
        return null;
      }
      return JSON.parse(value) as T;
    } catch (error) {
      console.error('❌ Redis GET error:', error);
      return null;
    }
  }

  /**
   * Delete a key from Redis
   * @param key - Cache key
   */
  async delete(key: string): Promise<boolean> {
    if (!this.isHealthy() || !this.client) {
      console.warn('⚠️  Redis not available, skipping delete operation');
      return false;
    }

    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      console.error('❌ Redis DEL error:', error);
      return false;
    }
  }

  /**
   * Delete multiple keys matching a pattern
   * Uses SCAN for better performance (non-blocking)
   * @param pattern - Key pattern (e.g., 'user:*')
   */
  async deletePattern(pattern: string): Promise<number> {
    if (!this.isHealthy() || !this.client) {
      console.warn('⚠️  Redis not available, skipping delete pattern operation');
      return 0;
    }

    try {
      let cursor: any = 0; // Redis SCAN cursor type compatibility
      let count = 0;

      do {
        // Use SCAN instead of KEYS for non-blocking iteration
        const result = await this.client.scan(cursor, {
          MATCH: pattern,
          COUNT: 100,
        });

        cursor = result.cursor;

        if (result.keys.length > 0) {
          await this.client.del(result.keys);
          count += result.keys.length;
        }
      } while (Number(cursor) !== 0);

      return count;
    } catch (error) {
      console.error('❌ Redis DELETE PATTERN error:', error);
      return 0;
    }
  }

  /**
   * Check if a key exists
   * @param key - Cache key
   */
  async exists(key: string): Promise<boolean> {
    if (!this.isHealthy() || !this.client) {
      return false;
    }

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.error('❌ Redis EXISTS error:', error);
      return false;
    }
  }

  /**
   * Set expiration time on a key
   * @param key - Cache key
   * @param seconds - TTL in seconds
   */
  async expire(key: string, seconds: number): Promise<boolean> {
    if (!this.isHealthy() || !this.client) {
      return false;
    }

    try {
      await this.client.expire(key, seconds);
      return true;
    } catch (error) {
      console.error('❌ Redis EXPIRE error:', error);
      return false;
    }
  }

  /**
   * Increment a counter in Redis
   * @param key - Cache key
   * @param amount - Amount to increment (default: 1)
   */
  async increment(key: string, amount: number = 1): Promise<number | null> {
    if (!this.isHealthy() || !this.client) {
      return null;
    }

    try {
      return await this.client.incrBy(key, amount);
    } catch (error) {
      console.error('❌ Redis INCR error:', error);
      return null;
    }
  }

  /**
   * Get Redis server info and stats
   */
  async getInfo(): Promise<Record<string, string> | null> {
    if (!this.isHealthy() || !this.client) {
      return null;
    }

    try {
      const info = await this.client.info();
      const lines = info.split('\r\n');
      const result: Record<string, string> = {};

      for (const line of lines) {
        if (line && !line.startsWith('#')) {
          const [key, value] = line.split(':');
          if (key && value) {
            result[key.trim()] = value.trim();
          }
        }
      }

      return result;
    } catch (error) {
      console.error('❌ Redis INFO error:', error);
      return null;
    }
  }
}

// Export singleton instance
export const redisConnection = RedisConnection.getInstance();
