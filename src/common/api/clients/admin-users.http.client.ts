import { authenticatedFetch } from '@common/api/clients/http.helpers';
import { extractAccessTokenFromEnvelope } from '@common/api/mappers/auth-session.mapper';
import { writeAccessToken } from '@common/lib/storage/auth-session.storage';
import type { AdminUser } from '@common/domain/admin.domain';

/**
 * Why: cliente de la consola de seguridad. Todo pasa por `authenticatedFetch` (Bearer + refresh 401).
 * Las acciones sensibles (revoke/flags/delete) se ejecutan con el token ELEVADO por step-up 2FA
 * (acr=high): el flujo de step-up reescribe el access token en storage antes de llamar acá, así que
 * estos métodos no reciben el token — usan el vigente (elevado) automáticamente.
 */

interface Envelope<T> {
    success: boolean;
    statusCode: number;
    data?: T;
}

export async function fetchUsers(): Promise<{ ok: boolean; users: AdminUser[]; status: number }> {
    const res = await authenticatedFetch('/api/users', { method: 'GET' });
    const body = res.body as Envelope<{ items?: AdminUser[] }> | null;
    return { ok: res.ok, status: res.status, users: body?.data?.items ?? [] };
}

/** Kill-switch: denylist por usuario, instantáneo. Requiere step-up (acr=high). */
export async function revokeUser(userId: string, reason: string) {
    return authenticatedFetch(`/api/admin/users/${userId}/revoke`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
    });
}

/** Banear / suspender / (re)activar. Campos nullable: se manda solo lo que cambia. */
export async function setUserFlags(
    userId: string,
    flags: { isActive?: boolean; isBanned?: boolean; isSuspended?: boolean; suspendedUntil?: string | null },
) {
    return authenticatedFetch(`/api/users/${userId}/flags`, {
        method: 'PATCH',
        body: JSON.stringify(flags),
    });
}

/** Baja del usuario. Destructivo. Requiere step-up. */
export async function deleteUser(userId: string) {
    return authenticatedFetch(`/api/users/${userId}`, { method: 'DELETE' });
}

/* ── Step-up 2FA (PEN-1): elevar a acr=high antes de una operación sensible ── */

/** Pide el challenge para una operación. Devuelve el challengeToken a firmar con el 2FA. */
export async function stepUpChallenge(
    operationHint: string,
): Promise<{ ok: boolean; challengeToken?: string; error?: string }> {
    const res = await authenticatedFetch('/api/auth/step-up/challenge', {
        method: 'POST',
        body: JSON.stringify({ operationHint }),
    });
    const body = res.body as Envelope<{ challengeToken?: string }> | null;
    return {
        ok: res.ok,
        challengeToken: body?.data?.challengeToken,
        error: res.ok ? undefined : 'No se pudo iniciar el paso de 2FA.',
    };
}

/** Verifica el código TOTP. Si OK, guarda el access token ELEVADO (acr=high) para las acciones. */
export async function stepUpVerify(
    challengeToken: string,
    code: string,
): Promise<{ ok: boolean; error?: string }> {
    const res = await authenticatedFetch('/api/auth/step-up/verify', {
        method: 'POST',
        body: JSON.stringify({ challengeToken, factor: 'totp', value: code }),
    });
    if (res.ok) {
        const elevated = extractAccessTokenFromEnvelope(res.body);
        if (elevated) writeAccessToken(elevated);
    }
    return { ok: res.ok, error: res.ok ? undefined : 'Código inválido o vencido.' };
}
