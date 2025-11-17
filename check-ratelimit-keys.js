const redis = require('redis');

const REDIS_URL = "redis://default:Z6vDQI28kQPmJbr5IKzOdBXzkEgPTJab@redis-12527.c295.ap-southeast-1-1.ec2.redns.redis-cloud.com:12527";

async function checkRateLimitKeys() {
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

    // Get ALL keys
    const allKeys = await client.keys('*');
    console.log(`📊 Total keys: ${allKeys.length}\n`);

    // Group keys by exact prefix
    const keysByPrefix = {};
    for (const key of allKeys) {
      const prefix = key.split(':')[0];
      if (!keysByPrefix[prefix]) {
        keysByPrefix[prefix] = [];
      }
      keysByPrefix[prefix].push(key);
    }

    console.log('📋 Keys grouped by prefix:\n');
    for (const [prefix, keys] of Object.entries(keysByPrefix)) {
      console.log(`  ${prefix}: ${keys.length} keys`);
      keys.forEach(k => console.log(`    - ${k}`));
    }

    // Look for rate limit patterns
    console.log('\n🔍 Searching for rate limit patterns:\n');
    const rateLimitPatterns = [
      'ratelimit:*',
      'rate_limit:*',
      'rate:*',
      'chatbot:*'
    ];

    for (const pattern of rateLimitPatterns) {
      const matches = await client.keys(pattern);
      console.log(`  Pattern "${pattern}": ${matches.length} matches`);
      if (matches.length > 0) {
        matches.forEach(k => {
          console.log(`    - ${k}`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.quit();
    console.log('\n✅ Disconnected from Redis\n');
  }
}

checkRateLimitKeys();
