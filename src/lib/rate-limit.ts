// Bellek içi kayan pencere hız sınırlayıcı
// Birden fazla sunucu örneği için Redis ile değiştirilmelidir

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

export function rateLimit(
  identifier: string,
  limit: number,
  windowMs: number
): { success: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = store.get(identifier);

  // Süresi dolmuş kayıtları periyodik olarak temizle
  if (store.size > 10000) {
    for (const [key, val] of store) {
      if (val.resetAt <= now) store.delete(key);
    }
  }

  if (!entry || entry.resetAt <= now) {
    store.set(identifier, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  if (entry.count >= limit) {
    return { success: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { success: true, remaining: limit - entry.count, resetAt: entry.resetAt };
}
