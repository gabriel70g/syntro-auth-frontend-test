'use client';

import { useSessionClaims } from '@common/hooks/useSessionClaims';
import { formatExpiry } from '@common/lib/jwt';

/**
 * Why: Claims de la sesión (los devuelve el BFF, sin token) para la vista.
 */
export function useDashboardSession() {
    const { claims } = useSessionClaims();
    return { claims, formatExpiry };
}
