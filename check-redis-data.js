const redis = require('redis');

const REDIS_URL = "redis://default:Z6vDQI28kQPmJbr5IKzOdBXzkEgPTJab@redis-12527.c295.ap-southeast-1-1.ec2.redns.redis-cloud.com:12527";

async function checkRedisData() {
  const client = redis.createClient({
    url: REDIS_URL,
    socket: {
      reconnectStrategy: (retries) => Math.min(retries * 50, 500)
    }
  });

  try {
    console.log('\n🔌 Connecting to Redis...\n');
    await client.connect();
    console.log('✅ Connected!\n');

    // Get all keys
    console.log('📋 All Keys in Redis:\n');
    const keys = await client.keys('*');
    console.log(`Total keys: ${keys.length}\n`);

    if (keys.length === 0) {
      console.log('❌ NO KEYS FOUND - Redis is empty!\n');
    } else {
      // Group keys by pattern
      const patterns = {
        memories: keys.filter(k => k.startsWith('memories:')),
        rateLimit: keys.filter(k => k.startsWith('rate_limit:')),
        session: keys.filter(k => k.startsWith('session:')),
        other: keys.filter(k => !k.startsWith('memories:') && !k.startsWith('rate_limit:') && !k.startsWith('session:'))
      };

      console.log('📊 Keys by category:\n');
      console.log(`  Memory Cache: ${patterns.memories.length} keys`);
      console.log(`  Rate Limiting: ${patterns.rateLimit.length} keys`);
      console.log(`  Sessions: ${patterns.session.length} keys`);
      console.log(`  Other: ${patterns.other.length} keys\n`);

      // Show first 10 keys
      console.log('🔍 First 10 keys:\n');
      for (const key of keys.slice(0, 10)) {
        const type = await client.type(key);
        const ttl = await client.ttl(key);
        console.log(`  ${key}`);
        console.log(`    Type: ${type}, TTL: ${ttl === -1 ? 'no expiry' : ttl + 's'}`);
        
        if (type === 'string') {
          const value = await client.get(key);
          if (value && value.length < 200) {
            console.log(`    Value: ${value.substring(0, 100)}...`);
          }
        }
        console.log('');
      }

      // Check for recent rate limit keys
      console.log('\n⏱️ Recent Rate Limit Keys:\n');
      const rateLimitKeys = await client.keys('rate_limit:*');
      for (const key of rateLimitKeys.slice(0, 5)) {
        const count = await client.get(key);
        const ttl = await client.ttl(key);
        console.log(`  ${key}: ${count} requests, TTL: ${ttl}s`);
      }
    }

    // Get Redis info
    console.log('\n📈 Redis Stats:\n');
    const info = await client.info('stats');
    const lines = info.split('\r\n').filter(l => l && !l.startsWith('#'));
    console.log(lines.slice(0, 10).join('\n'));

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.quit();
    console.log('\n✅ Disconnected from Redis\n');
  }
}

checkRedisData();
