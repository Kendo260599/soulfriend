import { createClient, RedisClientType } from 'redis';

class RedisService {
  private static instance: RedisService;
  private client: RedisClientType | null = null;
  private isConnected: boolean = false;

  private constructor() {}

  static getInstance(): RedisService {
    if (!RedisService.instance) {
      RedisService.instance = new RedisService();
    }
    return RedisService.instance;
  }

  async connect(): Promise<void> {
    if (this.isConnected && this.client) {
      console.log('✅ Redis already connected');
      return;
    }

    try {
      this.client = createClient({
        username: process.env.REDIS_USERNAME || 'default',
        password: process.env.REDIS_PASSWORD,
        socket: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379'),
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              console.error('❌ Redis: Too many reconnection attempts');
              return new Error('Too many reconnection attempts');
            }
            // Exponential backoff: 50ms, 100ms, 200ms, 400ms, etc.
            return Math.min(retries * 50, 3000);
          },
        },
      });

      this.client.on('error', (err) => {
        console.error('❌ Redis Client Error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        console.log('🔄 Redis connecting...');
      });

      this.client.on('ready', () => {
        console.log('✅ Redis connected successfully!');
        this.isConnected = true;
      });

      this.client.on('reconnecting', () => {
        console.log('🔄 Redis reconnecting...');
        this.isConnected = false;
      });

      this.client.on('end', () => {
        console.log('⚠️ Redis connection closed');
        this.isConnected = false;
      });

      await this.client.connect();
      
      // Wait for 'ready' event to ensure connection is fully established
      if (!this.isConnected) {
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Redis connection timeout'));
          }, 5000); // 5 second timeout

          this.client!.once('ready', () => {
            clearTimeout(timeout);
            resolve();
          });
        });
      }
    } catch (error) {
      console.error('❌ Failed to connect to Redis:', error);
      this.isConnected = false;
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client && this.isConnected) {
      await this.client.quit();
      this.isConnected = false;
      console.log('✅ Redis disconnected');
    }
  }

  getClient(): RedisClientType {
    if (!this.client || !this.isConnected) {
      throw new Error('Redis client is not connected. Call connect() first.');
    }
    return this.client;
  }

  isReady(): boolean {
    return this.isConnected;
  }

  // ==========================================
  // 🔧 UTILITY METHODS
  // ==========================================

  /**
   * Set a key with optional expiration (in seconds)
   */
  async set(key: string, value: string, expirationSeconds?: number): Promise<void> {
    const client = this.getClient();
    if (expirationSeconds) {
      await client.setEx(key, expirationSeconds, value);
    } else {
      await client.set(key, value);
    }
  }

  /**
   * Get value by key
   */
  async get(key: string): Promise<string | null> {
    const client = this.getClient();
    return await client.get(key);
  }

  /**
   * Delete one or more keys
   */
  async delete(...keys: string[]): Promise<number> {
    const client = this.getClient();
    return await client.del(keys);
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    const client = this.getClient();
    const result = await client.exists(key);
    return result === 1;
  }

  /**
   * Set expiration on a key (in seconds)
   */
  async expire(key: string, seconds: number): Promise<boolean> {
    const client = this.getClient();
    const result = await client.expire(key, seconds);
    return result === 1;
  }

  /**
   * Get TTL (time to live) of a key
   */
  async ttl(key: string): Promise<number> {
    const client = this.getClient();
    return await client.ttl(key);
  }

  // ==========================================
  // 📦 CACHING HELPERS
  // ==========================================

  /**
   * Cache data with automatic JSON serialization
   */
  async cacheJSON(key: string, data: any, expirationSeconds: number = 3600): Promise<void> {
    await this.set(key, JSON.stringify(data), expirationSeconds);
  }

  /**
   * Get cached JSON data with automatic parsing
   */
  async getCachedJSON<T>(key: string): Promise<T | null> {
    const data = await this.get(key);
    if (!data) return null;
    try {
      return JSON.parse(data) as T;
    } catch (error) {
      console.error(`Failed to parse cached JSON for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Get or set cache (fetch from source if not cached)
   */
  async getOrSet<T>(
    key: string,
    fetchFunction: () => Promise<T>,
    expirationSeconds: number = 3600
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.getCachedJSON<T>(key);
    if (cached !== null) {
      console.log(`✅ Cache HIT: ${key}`);
      return cached;
    }

    // If not in cache, fetch from source
    console.log(`⚠️ Cache MISS: ${key} - Fetching from source...`);
    const data = await fetchFunction();
    
    // Cache the result
    await this.cacheJSON(key, data, expirationSeconds);
    return data;
  }

  // ==========================================
  // 🔐 SESSION MANAGEMENT
  // ==========================================

  /**
   * Store session data
   */
  async setSession(sessionId: string, data: any, expirationSeconds: number = 86400): Promise<void> {
    await this.cacheJSON(`session:${sessionId}`, data, expirationSeconds);
  }

  /**
   * Get session data
   */
  async getSession<T>(sessionId: string): Promise<T | null> {
    return await this.getCachedJSON<T>(`session:${sessionId}`);
  }

  /**
   * Delete session
   */
  async deleteSession(sessionId: string): Promise<void> {
    await this.delete(`session:${sessionId}`);
  }

  // ==========================================
  // 📊 RATE LIMITING
  // ==========================================

  /**
   * Increment rate limit counter
   * Returns current count
   */
  async incrementRateLimit(key: string, windowSeconds: number = 60): Promise<number> {
    const client = this.getClient();
    const rateLimitKey = `ratelimit:${key}`;
    
    const count = await client.incr(rateLimitKey);
    
    // Set expiration on first increment
    if (count === 1) {
      await client.expire(rateLimitKey, windowSeconds);
    }
    
    return count;
  }

  /**
   * Check if rate limit exceeded
   */
  async isRateLimited(key: string, maxRequests: number, windowSeconds: number = 60): Promise<boolean> {
    const count = await this.incrementRateLimit(key, windowSeconds);
    return count > maxRequests;
  }
}

// Export singleton instance
export const redisService = RedisService.getInstance();
export default redisService;
