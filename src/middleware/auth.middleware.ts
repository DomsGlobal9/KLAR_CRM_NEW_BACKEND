import { Request, Response, NextFunction } from 'express';
import { createHash } from 'crypto';
import { supabase } from '../config';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    [key: string]: any;
  };
}

/**
 * Verified-token cache.
 *
 * Every authenticated request used to call supabase.auth.getUser(), which is a
 * network round trip to the Supabase Auth API — 100-300ms added to each request,
 * against a rate-limited external service. Since a token's identity does not
 * change between calls, we verify once and reuse the result for a short window.
 *
 * Supabase remains the source of truth: the first request for a given token is
 * still verified remotely. Only the repeat lookups are served locally.
 *
 * Trade-off: a token revoked mid-window stays accepted until its cache entry
 * expires (default 60s). Call invalidateToken() on logout / forced sign-out to
 * close that gap. Entries never outlive the token's own `exp` claim.
 */
const TOKEN_CACHE_TTL_MS = 60_000;

/**
 * Hard bound so a long-running process cannot grow this map without limit.
 * At ~5k concurrent users this holds every active session comfortably.
 */
const TOKEN_CACHE_MAX_ENTRIES = 20_000;

interface CachedUser {
  user: AuthRequest['user'];
  expiresAt: number;
}

const tokenCache = new Map<string, CachedUser>();

/**
 * Tokens are hashed rather than stored raw, so a heap dump does not leak
 * usable credentials.
 */
const cacheKey = (token: string): string =>
  createHash('sha256').update(token).digest('hex');

/**
 * Read the `exp` claim without verifying the signature.
 *
 * This is only used to shorten the cache lifetime, never to make a trust
 * decision — Supabase has already validated the token by the time we call this.
 */
const readTokenExpiry = (token: string): number | null => {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;

    const decoded = JSON.parse(
      Buffer.from(payload, 'base64url').toString('utf8')
    );

    return typeof decoded.exp === 'number' ? decoded.exp * 1000 : null;
  } catch {
    return null;
  }
};

const readTokenCache = (key: string): AuthRequest['user'] | null => {
  const entry = tokenCache.get(key);

  if (!entry) return null;

  if (entry.expiresAt <= Date.now()) {
    tokenCache.delete(key);
    return null;
  }

  return entry.user;
};

const writeTokenCache = (key: string, user: AuthRequest['user'], token: string): void => {
  // Evict the oldest entry once the cap is reached. Map preserves insertion
  // order, so the first key is the least recently added.
  if (tokenCache.size >= TOKEN_CACHE_MAX_ENTRIES) {
    const oldestKey = tokenCache.keys().next().value;
    if (oldestKey) tokenCache.delete(oldestKey);
  }

  // Never cache a token past its own expiry.
  const tokenExpiry = readTokenExpiry(token);
  const ttlExpiry = Date.now() + TOKEN_CACHE_TTL_MS;

  tokenCache.set(key, {
    user,
    expiresAt: tokenExpiry ? Math.min(ttlExpiry, tokenExpiry) : ttlExpiry,
  });
};

/**
 * Drop a cached token immediately. Call on logout or forced sign-out.
 */
export const invalidateToken = (token: string): void => {
  tokenCache.delete(cacheKey(token));
};

/**
 * Drop every cached token. Call when revoking sessions broadly.
 */
export const invalidateAllTokens = (): void => {
  tokenCache.clear();
};

/**
 * Periodically drop expired entries so idle tokens do not linger in memory.
 * unref() keeps this timer from holding the process open on shutdown.
 */
const cleanupTimer = setInterval(() => {
  const now = Date.now();

  for (const [key, entry] of tokenCache) {
    if (entry.expiresAt <= now) tokenCache.delete(key);
  }
}, TOKEN_CACHE_TTL_MS);

cleanupTimer.unref();

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access token required' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  const key = cacheKey(token);

  // Fast path: token already verified within the cache window.
  const cachedUser = readTokenCache(key);
  if (cachedUser) {
    req.user = cachedUser;
    return next();
  }

  // Slow path: verify with Supabase, then cache the result.
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  const metadata = user.user_metadata || {};

  const authUser = {
    id: user.id,
    email: user.email!,
    role: metadata.role_name,
    ...metadata
  };

  writeTokenCache(key, authUser, token);

  req.user = authUser;

  next();
};

export const requireRole = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};
