import { Request, Response, NextFunction } from 'express';
import { createClient } from 'redis';

const client = createClient({
    username: 'default',
    password: process.env.REDIS_PASSWORD,
    socket: {
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT),
    }
});
client.on("connect", () => console.log("✅ Redis connected"));
client.on("error", (err) => console.error("❌ Redis error:", err.message));
client.on("close", () => console.warn("⚠️  Redis connection closed"));
client.connect();

export const rateLimiter = (limit = 100, windowSec = 60) => async (req: Request, res: Response, next: NextFunction) => {
    try {
        const key = `rate:${req.ip}`;
        const requests = await client.incr(key);
        if (requests === 1) await client.expire(key, windowSec);
        if (requests > limit) {
            const retryAfter = await client.ttl(key);
            return res.status(429).json({ error: 'Too many requests', retryAfter });
        }
        return next();
    } catch {
        return next(); // fail-open or switch to in-memory limiter fallback
    }
};
export const cache = (ttl = 60) => async (req: Request, res: Response, next: NextFunction) => {
    // Build a unique cache key from the URL
    if (req.method !== 'GET') return next();
    if (res.locals?.user?.id) return next(); // skip user-private endpoints

    const key = `cache:${req.originalUrl}`;

    try {
        const cached = await client.get(key);

        if (cached) {
            console.log(`🎯 Cache HIT: ${key}`);
            return res.json(JSON.parse(cached));        // Return cached data
        }

        console.log(`💾 Cache MISS: ${key}`);

        // Intercept res.json to save the response into Redis
        const originalJson = res.json.bind(res);
        res.json = async (data) => {
            await client.set(key, JSON.stringify(data), { EX: ttl });
            return originalJson(data);
        };

        next();
    } catch (err) {
        console.error("Cache middleware error:", err);
        next(); // On Redis failure, skip cache and hit DB
    }
};

// Invalidate cache by pattern (e.g., after a POST/PUT/DELETE)
export const invalidateCache = async (pattern: string) => {
    const keys: string[] = [];
    for await (const key of client.scanIterator({ MATCH: pattern, COUNT: 100 })) {
        keys.push(key as string);
    }
    if (keys.length) await client.del(keys);
};

export default client;

