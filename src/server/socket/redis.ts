import { Redis } from "ioredis";

export interface RedisAdapterClients {
    pubClient: Redis;
    subClient: Redis;
    appClient: Redis;
}

export async function initRedis(): Promise<RedisAdapterClients> {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
        throw new Error("REDIS_URL is required to initialize socket Redis clients");
    }

    const pubClient = new Redis(redisUrl, { lazyConnect: true });
    const subClient = new Redis(redisUrl, { lazyConnect: true });
    const appClient = new Redis(redisUrl, { lazyConnect: true });

    pubClient.on("error", (err: unknown) => console.error("❌ Redis Pub Error:", err));
    subClient.on("error", (err: unknown) => console.error("❌ Redis Sub Error:", err));
    appClient.on("error", (err: unknown) => console.error("❌ Redis App Error:", err));

    await Promise.all([
        pubClient.connect(),
        subClient.connect(),
        appClient.connect(),
    ]);

    console.log("✅ Redis clients connected");

    return { pubClient, subClient, appClient };
}