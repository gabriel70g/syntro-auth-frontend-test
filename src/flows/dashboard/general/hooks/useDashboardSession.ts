'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { decodeJwtPayload, formatExpiry, type JwtPayload } from '@common/lib/jwt';
import { readStoredAccessToken } from '@common/lib/storage/auth-session.storage';

/**
 * Why: Lee token de sessionStorage y expone claims para la vista.
 */
export function useDashboardSession() {
    const router = useRouter();
    const [claims, setClaims] = useState<JwtPayload | null>(null);

    useEffect(() => {
        const token = readStoredAccessToken();
        if (!token) {
            router.replace('/login');
            return;
        }
        setClaims(decodeJwtPayload(token));
    }, [router]);

    return { claims, formatExpiry };
}
