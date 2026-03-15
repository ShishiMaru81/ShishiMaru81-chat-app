import type { Redis } from "ioredis";
import {
    MESSAGE_DELIVERY_TTL_SECONDS,
    PRESENCE_HEARTBEAT_TTL_SECONDS,
    redisKeys,
    type MessageDeliveryState,
} from "../keys.js";

export async function trackSocketConnected(redis: Redis, userId: string, socketId: string) {
    await redis
        .multi()
        .set(redisKeys.onlineUser(userId), socketId)
        .sadd(redisKeys.userSockets(userId), socketId)
        .set(
            redisKeys.userPresence(userId),
            "online",
            "EX",
            PRESENCE_HEARTBEAT_TTL_SECONDS
        )
        .sadd(redisKeys.activeUsersSet, userId)
        .exec();

    const socketCount = await redis.scard(redisKeys.userSockets(userId));
    return { socketCount, becameOnline: socketCount === 1 };
}

export async function trackSocketDisconnected(redis: Redis, userId: string, socketId: string) {
    await redis.srem(redisKeys.userSockets(userId), socketId);

    const socketCount = await redis.scard(redisKeys.userSockets(userId));
    if (socketCount > 0) {
        const replacementSocketId = await redis.srandmember(redisKeys.userSockets(userId));
        if (replacementSocketId) {
            await redis.set(redisKeys.onlineUser(userId), replacementSocketId);
        }
        return { socketCount, wentOffline: false };
    }

    await redis
        .multi()
        .del(redisKeys.userSockets(userId))
        .del(redisKeys.onlineUser(userId))
        .del(redisKeys.userActiveConversation(userId))
        .del(redisKeys.userPresence(userId))
        .srem(redisKeys.activeUsersSet, userId)
        .exec();

    return { socketCount: 0, wentOffline: true };
}

export async function refreshPresence(redis: Redis, userId: string) {
    await redis.set(
        redisKeys.userPresence(userId),
        "online",
        "EX",
        PRESENCE_HEARTBEAT_TTL_SECONDS
    );
}

export async function setActiveConversation(redis: Redis, userId: string, conversationId: string) {
    await redis.set(redisKeys.userActiveConversation(userId), conversationId);
}

export async function clearActiveConversation(redis: Redis, userId: string, conversationId?: string) {
    if (!conversationId) {
        await redis.del(redisKeys.userActiveConversation(userId));
        return;
    }

    const current = await redis.get(redisKeys.userActiveConversation(userId));
    if (current === conversationId) {
        await redis.del(redisKeys.userActiveConversation(userId));
    }
}

export async function getActiveConversation(redis: Redis, userId: string) {
    return redis.get(redisKeys.userActiveConversation(userId));
}

export async function getActiveUsers(redis: Redis) {
    return redis.smembers(redisKeys.activeUsersSet);
}

export async function isUserOnline(redis: Redis, userId: string) {
    const [count, heartbeat] = await Promise.all([
        redis.scard(redisKeys.userSockets(userId)),
        redis.get(redisKeys.userPresence(userId)),
    ]);

    return count > 0 && Boolean(heartbeat);
}

export async function setMessageDeliveryState(
    redis: Redis,
    messageId: string,
    state: MessageDeliveryState
) {
    await redis.set(
        redisKeys.messageDelivery(messageId),
        state,
        "EX",
        MESSAGE_DELIVERY_TTL_SECONDS
    );
}

export async function getMessageDeliveryState(redis: Redis, messageId: string) {
    return redis.get(redisKeys.messageDelivery(messageId));
}
