import { createClient } from 'redis';

const client = createClient({
    username: 'default',
    password: 'KukvFehuuP2iegRw1iJdWCYwHyszYOC5',
    socket: {
        host: 'redis-11240.c93.us-east-1-3.ec2.cloud.redislabs.com',
        port: 11240
    }
});

client.on('error', err => console.log('Redis Client Error', err));

await client.connect();
console.log('✅ Connected to Redis Cloud!');

// Test basic operations
await client.set('foo', 'bar');
const result = await client.get('foo');
console.log('Test GET foo:', result);  // >>> bar

// Check all keys
const keys = await client.keys('*');
console.log('\nAll keys in Redis:', keys);

// Get database size
const dbSize = await client.dbSize();
console.log('Database size:', dbSize);

// Disconnect
await client.quit();
console.log('\n✅ Connection test complete!');
