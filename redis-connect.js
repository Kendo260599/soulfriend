const redis = require('redis');
const readline = require('readline');

// Redis connection URL
const redisUrl = 'redis://default:KukvFehuuP2iegRw1iJdWCYwHyszYOC5@redis-11240.c93.us-east-1-3.ec2.cloud.redislabs.com:11240';

// Create Redis client
const client = redis.createClient({
  url: redisUrl
});

// Handle connection events
client.on('error', (err) => console.error('Redis Client Error:', err));
client.on('connect', () => console.log('✅ Connected to Redis Cloud!'));
client.on('ready', () => {
  console.log('✅ Redis client ready\n');
  console.log('Available commands:');
  console.log('  KEYS *           - List all keys');
  console.log('  GET <key>        - Get value');
  console.log('  SET <key> <val>  - Set value');
  console.log('  DEL <key>        - Delete key');
  console.log('  PING             - Test connection');
  console.log('  INFO             - Server info');
  console.log('  exit             - Quit\n');
  startPrompt();
});

// Connect to Redis
(async () => {
  try {
    await client.connect();
  } catch (err) {
    console.error('Failed to connect:', err);
    process.exit(1);
  }
})();

// Interactive prompt
function startPrompt() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'redis> '
  });

  rl.prompt();

  rl.on('line', async (line) => {
    const cmd = line.trim();
    
    if (cmd.toLowerCase() === 'exit') {
      await client.quit();
      console.log('Goodbye!');
      process.exit(0);
    }

    if (!cmd) {
      rl.prompt();
      return;
    }

    try {
      const args = cmd.match(/(?:[^\s"]+|"[^"]*")+/g).map(arg => arg.replace(/^"|"$/g, ''));
      const command = args[0].toUpperCase();
      const params = args.slice(1);

      let result;
      
      // Handle common commands
      switch (command) {
        case 'KEYS':
          result = await client.keys(params[0] || '*');
          console.log(result);
          break;
        case 'GET':
          result = await client.get(params[0]);
          console.log(result);
          break;
        case 'SET':
          result = await client.set(params[0], params.slice(1).join(' '));
          console.log(result);
          break;
        case 'DEL':
          result = await client.del(params);
          console.log(`(integer) ${result}`);
          break;
        case 'PING':
          result = await client.ping();
          console.log(result);
          break;
        case 'INFO':
          result = await client.info(params[0]);
          console.log(result);
          break;
        case 'FLUSHALL':
          result = await client.flushAll();
          console.log(result);
          break;
        case 'DBSIZE':
          result = await client.dbSize();
          console.log(`(integer) ${result}`);
          break;
        case 'TTL':
          result = await client.ttl(params[0]);
          console.log(`(integer) ${result}`);
          break;
        case 'EXPIRE':
          result = await client.expire(params[0], parseInt(params[1]));
          console.log(`(integer) ${result}`);
          break;
        case 'HGETALL':
          result = await client.hGetAll(params[0]);
          console.log(result);
          break;
        case 'HGET':
          result = await client.hGet(params[0], params[1]);
          console.log(result);
          break;
        case 'HSET':
          result = await client.hSet(params[0], params[1], params.slice(2).join(' '));
          console.log(`(integer) ${result}`);
          break;
        default:
          // Try to execute any Redis command
          result = await client.sendCommand(args);
          console.log(result);
      }
    } catch (err) {
      console.error('Error:', err.message);
    }

    rl.prompt();
  });

  rl.on('close', async () => {
    await client.quit();
    console.log('\nGoodbye!');
    process.exit(0);
  });
}
