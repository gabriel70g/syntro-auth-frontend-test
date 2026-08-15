'use client';

import { useCallback, useEffect, useState } from 'react';
import {
    fetchUsers,
    revokeUser,
    setUserFlags,
    deleteUser,
} from '@common/api/clients/admin-users.http.client';
import { postAuthLogout } from '@common/api/clients/auth.http.client';
import { statusOf, type AdminUser } from '@common/domain/admin.domain';
import { decodeJwtPayload } from '@common/lib/jwt';
import {
    clearAuthSessionStorage,
    readStoredAccessToken,
} from '@common/lib/storage/auth-session.storage';

/**
 * Why: una acción sensible sobre un usuario. Se ejecuta SOLO tras el step-up 2FA (acr=high):
 * el modal hace challenge+verify y recién ahí llama a `run()`.
 */
export interface AdminAction {
    title: string;
    operationHint: string;
    danger: boolean;
    confirmLabel: string;
    run: () => Promise<{ ok: boolean }>;
}

/**
 * Why: estado de la consola de seguridad. Expone el rol del que mira (gate: esto es para pocos),
 * su email (para marcarlo/evitar auto-revocarse), y las acciones sensibles gateadas por 2FA.
 */
export function useAdminUsersController() {
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [role, setRole] = useState<string | null>(null);
    const [selfEmail, setSelfEmail] = useState<string | null>(null);
    const [pending, setPending] = useState<AdminAction | null>(null);

    const reload = useCallback(async () => {
        const claims = decodeJwtPayload(readStoredAccessToken() ?? '');
        setRole(claims?.role ?? null);
        setSelfEmail(claims?.email ?? null);
        setIsLoading(true);
        setError(null);
        const res = await fetchUsers();
        if (!res.ok) {
            setError(
                res.status === 403
                    ? 'No tenés permisos para ver esta consola.'
                    : 'No se pudo cargar el listado de usuarios.',
            );
            setUsers([]);
        } else {
            setUsers(res.users);
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        // Carga on-mount (mismo patrón que useDashboardSession); el setState va tras el await.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        void reload();
    }, [reload]);

    // ── Constructores de acción (cada una declara su operationHint para el step-up) ──
    const revokeSessions = (u: AdminUser): AdminAction => ({
        title: `Revocar todas las sesiones de ${u.email}`,
        operationHint: 'revoke_user',
        danger: true,
        confirmLabel: 'Revocar sesiones',
        run: async () => ({ ok: (await revokeUser(u.id, 'consola de seguridad')).ok }),
    });

    const suspend = (u: AdminUser): AdminAction => ({
        title: `Suspender a ${u.email}`,
        operationHint: 'suspend_user',
        danger: true,
        confirmLabel: 'Suspender',
        run: async () => ({ ok: (await setUserFlags(u.id, { isSuspended: true })).ok }),
    });

    const reactivate = (u: AdminUser): AdminAction => ({
        title: `Reactivar a ${u.email}`,
        operationHint: 'reactivate_user',
        danger: false,
        confirmLabel: 'Reactivar',
        run: async () => ({
            ok: (await setUserFlags(u.id, { isActive: true, isSuspended: false, isBanned: false })).ok,
        }),
    });

    const remove = (u: AdminUser): AdminAction => ({
        title: `Quitar a ${u.email}`,
        operationHint: 'delete_user',
        danger: true,
        confirmLabel: 'Quitar usuario',
        run: async () => ({ ok: (await deleteUser(u.id)).ok }),
    });

    /** Qué acción de estado ofrecer según el estado actual (suspender vs reactivar). */
    const toggleAction = (u: AdminUser): AdminAction =>
        statusOf(u) === 'activo' ? suspend(u) : reactivate(u);

    /** Cierra la sesión y vuelve al login (para entrar con otro usuario). */
    const logout = useCallback(async () => {
        await postAuthLogout().catch(() => undefined);
        clearAuthSessionStorage();
        window.location.href = '/login';
    }, []);

    return {
        users,
        isLoading,
        error,
        role,
        selfEmail,
        reload,
        logout,
        pending,
        setPending,
        actions: { revokeSessions, toggleAction, remove },
    };
}
