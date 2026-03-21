import type { AuthSession, User } from '@common/domain/auth.domain';
import { decodeJwtPayload } from '@common/lib/jwt';

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
