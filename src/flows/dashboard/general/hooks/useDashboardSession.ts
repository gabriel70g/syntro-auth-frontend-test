'use client';

import { useEffect, useState } from 'react';
import { decodeJwtPayload, formatExpiry, type JwtPayload } from '@common/lib/jwt';
import { readStoredAccessToken } from '@common/lib/storage/auth-session.storage';

/**
 * Why: Lee token de memoria y expone claims para la vista (sin fetch).
 */
export function useDashboardSession() {
    const [claims, setClaims] = useState<JwtPayload | null>(null);

    useEffect(() => {
        const token = readStoredAccessToken();
        if (!token) {
            window.location.href = '/login';
            return;
        }
        setClaims(decodeJwtPayload(token));
    }, []);

    return { claims, formatExpiry };
}
