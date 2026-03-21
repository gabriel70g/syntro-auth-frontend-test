'use client';

import { useEffect, useState } from 'react';
import { decodeJwtPayload, formatExpiry, type JwtPayload } from '@common/lib/jwt';

/**
 * Why: Lee token del storage y expone claims para la vista (sin fetch).
 */
export function useDashboardSession() {
    const [claims, setClaims] = useState<JwtPayload | null>(null);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const token = localStorage.getItem('auth_token');
        if (!token) {
            window.location.href = '/login';
            return;
        }
        setClaims(decodeJwtPayload(token));
    }, []);

    return { claims, formatExpiry };
}
