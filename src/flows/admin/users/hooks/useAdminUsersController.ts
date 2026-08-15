'use client';

import { useCallback, useEffect, useState } from 'react';
import { fetchUsers } from '@common/api/clients/admin-users.http.client';
import type { AdminUser } from '@common/domain/admin.domain';
import { decodeJwtPayload } from '@common/lib/jwt';
import { readStoredAccessToken } from '@common/lib/storage/auth-session.storage';

/**
 * Why: estado de la consola de seguridad. Además del listado, expone el rol del que mira
 * (para el gate: esto es para pocos) y su email (para no dejar que se auto-revoque sin querer).
 */
export function useAdminUsersController() {
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [role, setRole] = useState<string | null>(null);
    const [selfEmail, setSelfEmail] = useState<string | null>(null);

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

    return { users, isLoading, error, role, selfEmail, reload };
}
