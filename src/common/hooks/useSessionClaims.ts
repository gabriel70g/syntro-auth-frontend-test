'use client';

import { useEffect, useState } from 'react';
import { getSessionClaims } from '@common/api/clients/session.http.client';
import type { JwtPayload } from '@common/lib/jwt';

/**
 * Why: claims de la sesión para decidir qué se muestra. Solo UI: la autorización la aplica el backend.
 */
export function useSessionClaims(): { claims: JwtPayload | null; loading: boolean } {
    const [state, setState] = useState<{ claims: JwtPayload | null; loading: boolean }>({ claims: null, loading: true });

    useEffect(() => {
        let alive = true;
        void getSessionClaims().then((claims) => {
            if (alive) setState({ claims, loading: false });
        });
        return () => {
            alive = false;
        };
    }, []);

    return state;
}
