/**
 * Test Rate Limiter
 * Send multiple requests to test if rate limiting works
 */

const redis = require('redis');

// Redis connection config
const REDIS_CONFIG = {
  socket: {
    host: 'redis-12527.c295.ap-southeast-1-1.ec2.redns.redis-cloud.com',
    port: 12527,
  },
  username: 'default',
  password: '***REDACTED_REDIS_PASSWORD***',
};

async function testRateLimiter() {
  const client = redis.createClient(REDIS_CONFIG);

  client.on('error', (err) => console.error('❌ Redis Client Error', err));

  try {
    console.log('🔌 Connecting to Redis...\n');
    await client.connect();
    console.log('✅ Connected!\n');

    // Simulate rate limiter behavior
    const testKey = 'test_chatbot_rate';
    const maxRequests = 5;
    const windowSeconds = 60;

    console.log('🧪 Testing Rate Limiter Logic:\n');
    console.log(`   Max requests: ${maxRequests}`);
    console.log(`   Window: ${windowSeconds}s\n`);

    // Clear any existing test key
    await client.del(`ratelimit:${testKey}`);
    console.log('🧹 Cleared old test key\n');

    // Simulate multiple requests
    for (let i = 1; i <= 7; i++) {
      const key = `ratelimit:${testKey}`;
      const count = await client.incr(key);

      // Set expiration on first increment
      if (count === 1) {
        await client.expire(key, windowSeconds);
        console.log(`   ⏰ Set TTL: ${windowSeconds}s`);
      }

      const ttl = await client.ttl(key);
      const isLimited = count > maxRequests;

      if (isLimited) {
        console.log(`   🚫 Request ${i}: BLOCKED (count=${count}, TTL=${ttl}s)`);
      } else {
        console.log(`   ✅ Request ${i}: OK (count=${count}, remaining=${maxRequests - count}, TTL=${ttl}s)`);
      }
    }

    console.log('\n📊 Final Check:\n');

    // Check all ratelimit keys
    const keys = await client.keys('ratelimit:*');
    console.log(`   Found ${keys.length} rate limit keys:`);

    for (const key of keys) {
      const count = await client.get(key);
      const ttl = await client.ttl(key);
      console.log(`   - ${key}: count=${count}, TTL=${ttl}s`);
    }

    // Cleanup
    console.log('\n🧹 Cleaning up test key...');
    await client.del(`ratelimit:${testKey}`);

    console.log('\n✅ Test Complete!');
    console.log('\n💡 If you see rate limit keys, the fix works!');

  } catch (error) {
    console.error('\n❌ Error:', error);
  } finally {
    await client.disconnect();
    console.log('\n✅ Disconnected from Redis');
  }
}

testRateLimiter();
