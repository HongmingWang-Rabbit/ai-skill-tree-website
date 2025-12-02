import { Redis } from '@upstash/redis';

export const redis = Redis.fromEnv();

const CACHE_TTL = 86400; // 24 hours in seconds

export async function getCachedCareer<T>(key: string): Promise<T | null> {
  try {
    const data = await redis.get<T>(`career:${key}`);
    return data;
  } catch (error) {
    console.error('Cache get error:', error);
    return null;
  }
}

export async function setCachedCareer<T>(key: string, data: T): Promise<void> {
  try {
    await redis.set(`career:${key}`, data, { ex: CACHE_TTL });
  } catch (error) {
    console.error('Cache set error:', error);
  }
}

export async function invalidateCareerCache(key: string): Promise<void> {
  try {
    await redis.del(`career:${key}`);
  } catch (error) {
    console.error('Cache invalidation error:', error);
  }
}

export async function getCachedSkillGraph<T>(careerId: string): Promise<T | null> {
  try {
    const data = await redis.get<T>(`skillgraph:${careerId}`);
    return data;
  } catch (error) {
    console.error('Cache get error:', error);
    return null;
  }
}

export async function setCachedSkillGraph<T>(careerId: string, data: T): Promise<void> {
  try {
    await redis.set(`skillgraph:${careerId}`, data, { ex: CACHE_TTL });
  } catch (error) {
    console.error('Cache set error:', error);
  }
}
