import { Request, Response, NextFunction } from 'express';
import { createHash } from 'crypto';
import { verifyAccessToken } from '../utils/jwt.utils';
import { AuthRepository } from '../repositories/auth.repository';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    [key: string]: any;
  };
}

const TOKEN_CACHE_TTL_MS = 60_000;
const TOKEN_CACHE_MAX_ENTRIES = 20_000;

interface CachedUser {
  user: AuthRequest['user'];
  expiresAt: number;
}

const tokenCache = new Map<string, CachedUser>();

const cacheKey = (token: string): string =>
  createHash('sha256').update(token).digest('hex');

const readTokenCache = (key: string): AuthRequest['user'] | null => {
  const entry = tokenCache.get(key);

  if (!entry) return null;

  if (entry.expiresAt <= Date.now()) {
    tokenCache.delete(key);
    return null;
  }

  return entry.user;
};

const writeTokenCache = (key: string, user: AuthRequest['user']): void => {
  if (tokenCache.size >= TOKEN_CACHE_MAX_ENTRIES) {
    const oldestKey = tokenCache.keys().next().value;
    if (oldestKey) tokenCache.delete(oldestKey);
  }

  tokenCache.set(key, {
    user,
    expiresAt: Date.now() + TOKEN_CACHE_TTL_MS,
  });
};

export const invalidateToken = (token: string): void => {
  tokenCache.delete(cacheKey(token));
};

export const invalidateAllTokens = (): void => {
  tokenCache.clear();
};

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

  // Verify JWT token locally without external network call
  const payload = verifyAccessToken(token);
  if (!payload || !payload.sub) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  const userId = payload.sub;
  const userRes = await AuthRepository.getUserById(userId);

  if (!userRes.user) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  const metadata = userRes.user.user_metadata || {};

  const authUser = {
    id: userRes.user.id,
    email: userRes.user.email || payload.email,
    role: payload.role || metadata.role_name || 'SUPERADMIN',
    ...metadata
  };

  writeTokenCache(key, authUser);

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
