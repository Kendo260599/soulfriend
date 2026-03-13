import redisService from './redisService';
import { logger } from '../utils/logger';

export interface ActivePromptConfig {
  version: string;
  systemPrompt: string;
  activatedAt?: string;
}

class PromptConfigService {
  private cache: ActivePromptConfig | null = null;
  private cacheExpiresAt = 0;
  private readonly CACHE_TTL_MS = 60_000;

  async getActivePrompt(): Promise<ActivePromptConfig | null> {
    const now = Date.now();
    if (this.cache && now < this.cacheExpiresAt) {
      return this.cache;
    }

    if (!redisService.isReady()) {
      this.cache = null;
      this.cacheExpiresAt = now + this.CACHE_TTL_MS;
      return null;
    }

    try {
      const raw = await redisService.get('sf:prompt:active');
      if (!raw) {
        this.cache = null;
        this.cacheExpiresAt = now + this.CACHE_TTL_MS;
        return null;
      }

      const parsed = JSON.parse(raw) as Partial<ActivePromptConfig>;
      if (!parsed.systemPrompt || typeof parsed.systemPrompt !== 'string') {
        this.cache = null;
        this.cacheExpiresAt = now + this.CACHE_TTL_MS;
        return null;
      }

      const config: ActivePromptConfig = {
        version: typeof parsed.version === 'string' && parsed.version.trim().length > 0 ? parsed.version : 'unknown',
        systemPrompt: parsed.systemPrompt,
        activatedAt: parsed.activatedAt,
      };

      this.cache = config;
      this.cacheExpiresAt = now + this.CACHE_TTL_MS;
      return config;
    } catch (error) {
      logger.warn('[PromptConfig] Failed to load active prompt from Redis, using default prompt:', error);
      this.cache = null;
      this.cacheExpiresAt = now + this.CACHE_TTL_MS;
      return null;
    }
  }
}

export const promptConfigService = new PromptConfigService();
export default promptConfigService;
