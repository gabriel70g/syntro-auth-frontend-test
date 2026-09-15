/**
 * Why: Config y headers base; sin lógica de negocio.
 * El navegador solo habla con el BFF del mismo origen (`/api/*`): la URL del backend vive en el servidor
 * (`src/server/config.ts`) y no entra al bundle.
 */

import { readActiveTenant } from '@common/lib/storage/tenant.storage';

export const DEFAULT_TENANT_ID =
    (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_TENANT_ID) ||
    'a0000000-0000-0000-0000-000000000001';

export function getDefaultHeaders(): Record<string, string> {
    return {
        'Content-Type': 'application/json',
        'X-Tenant-Id': readActiveTenant()?.id ?? DEFAULT_TENANT_ID,
    };
}

export function mergeHeaders(
    base: Record<string, string>,
    extra: Record<string, string | undefined>
): Record<string, string> {
    const out = { ...base };
    for (const [k, v] of Object.entries(extra)) {
        if (v !== undefined) out[k] = v;
    }
    return out;
}
