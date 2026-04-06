import type { AuthSession, User } from '@common/domain/auth.domain';
import { decodeJwtPayload } from '@common/lib/jwt';
import { isRecord } from '@common/api/mappers/json-guards';

/**
 * Why: Extrae accessToken de un envelope { data: { accessToken } } — útil para refresh responses.
 */
export function extractAccessTokenFromEnvelope(body: unknown): string | null {
    if (!isRecord(body) || !isRecord(body.data)) return null;
    const token = body.data.accessToken;
    return typeof token === 'string' ? token : null;
}

/**
 * Why: Construye sesión de UI desde tokens; no conoce HTTP.
 */
export function mapAccessTokenPairToAuthSession(
    accessToken: string,
    refreshToken: string | undefined
): AuthSession | null {
    const payload = decodeJwtPayload(accessToken);
    if (!payload?.sub || !payload.email || typeof payload.email !== 'string') {
        return null;
    }

    const user: User = {
        id: payload.sub,
        email: payload.email,
        name: payload.email.split('@')[0] ?? payload.email,
        role: typeof payload.role === 'string' ? payload.role : undefined,
    };

    return {
        token: accessToken,
        refreshToken,
        user,
    };
}
