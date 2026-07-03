import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "redis";

// Determine the script's directory and load the environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.resolve(__dirname, "../.env.local"),
});

const redisHost = process.env.REDIS_HOST;
const redisPort = process.env.REDIS_PORT;
const redisPassword = process.env.REDIS_PASSWORD;

if (!redisHost || !redisPort) {
  console.error("❌ Error: REDIS_HOST or REDIS_PORT is not defined in .env.local");
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

client.on("error", (err) => {
  console.error("❌ Redis Client Error:", err.message || err);
});

async function main() {
  try {
    await client.connect();
    console.log("✅ Successfully connected to Redis.");

    console.log("🧹 Flushing all keys from Redis...");
    const result = await client.flushAll();
    console.log(`✨ Success: Redis cache cleared completely. Result: ${result}`);
  } catch (error: any) {
    console.error("💥 Failed to clear Redis cache:", error.message || error);
    process.exit(1);
  } finally {
    try {
      await client.disconnect();
      console.log("🔌 Disconnected from Redis.");
    } catch (disconnectError) {
      // Ignore disconnect errors
    }
  }
}

main();
