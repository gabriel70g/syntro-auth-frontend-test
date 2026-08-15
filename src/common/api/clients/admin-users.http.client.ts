import { authenticatedFetch } from '@common/api/clients/http.helpers';
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
