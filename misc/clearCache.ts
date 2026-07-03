import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

// Determine the script's directory
let scriptDir = '';
try {
  const __filename = fileURLToPath(import.meta.url);
  scriptDir = path.dirname(__filename);
} catch (e) {
  scriptDir = __dirname;
}

// Create a require function that resolves from the backend folder to find installed node_modules
const backendDir = path.resolve(scriptDir, '../backend');
const requireFromBackend = createRequire(path.resolve(backendDir, 'package.json'));

// Load dependencies from backend node_modules
const dotenv = requireFromBackend('dotenv');
const { createClient } = requireFromBackend('redis');

// Load environment variables from backend/.env.local
const envPath = path.resolve(backendDir, '.env.local');
dotenv.config({ path: envPath });

const redisHost = process.env.REDIS_HOST;
const redisPort = process.env.REDIS_PORT;
const redisPassword = process.env.REDIS_PASSWORD;

if (!redisHost || !redisPort) {
  console.error("❌ Error: REDIS_HOST or REDIS_PORT is not defined in backend/.env.local");
  process.exit(1);
}

console.log(`🔌 Connecting to Redis at ${redisHost}:${redisPort}...`);

const client = createClient({
  username: 'default',
  password: redisPassword,
  socket: {
    host: redisHost,
    port: Number(redisPort),
    connectTimeout: 5000,
  }
});

client.on('error', (err: any) => {
  console.error('❌ Redis Client Error:', err.message || err);
});

async function main() {
  try {
    await client.connect();
    console.log('✅ Successfully connected to Redis client.');
    
    console.log('🧹 Flushing all keys from Redis...');
    const result = await client.flushAll();
    
    console.log(`✨ Success: Redis cache cleared completely. Result: ${result}`);
  } catch (error: any) {
    console.error('💥 Failed to clear Redis cache:', error.message || error);
    process.exit(1);
  } finally {
    try {
      await client.disconnect();
      console.log('🔌 Disconnected from Redis client.');
    } catch (disconnectError) {
      // Ignore disconnect errors
    }
  }
}

main();
