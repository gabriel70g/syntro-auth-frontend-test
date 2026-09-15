import { authenticatedFetch, bffFetch, readJsonSafe, redirectIfSessionExpired } from '@common/api/clients/http.helpers';
import type { KitFormat } from '@common/domain/tenant.domain';

/**
 * Why: Transporte de /api/tenants. El mapeo a dominio vive en tenant.mapper.ts.
 */

/** Signup anónimo: empresa + usuario dueño. `password` ya viene cifrada con el handshake RSA. */
export async function postRegisterTenant(body: { tenantName: string; email: string; password: string }) {
    const res = await bffFetch('/api/tenants/register', {
        method: 'POST',
        body: JSON.stringify({
            tenant: { name: body.tenantName },
            user: { email: body.email, password: body.password, provider: 'email' },
        }),
    });
    return { status: res.status, body: res.body };
}

export async function getTenantByName(name: string) {
    const res = await bffFetch(`/api/tenants/by-name/${encodeURIComponent(name)}`, { method: 'GET' });
    return { status: res.status, body: res.body };
}

export async function getMyTenant() {
    const res = await authenticatedFetch('/api/tenants/mine', { method: 'GET' });
    return { status: res.status, body: res.body };
}

export async function postCreateTenant(name: string) {
    const res = await authenticatedFetch('/api/tenants', { method: 'POST', body: JSON.stringify({ name }) });
    return { status: res.status, body: res.body };
}

/** Descarga binaria del kit. La sesión va en cookie; el refresh, si hace falta, lo hace el BFF. */
export async function fetchIntegrationKit(
    tenantId: string,
    format: KitFormat,
): Promise<{ status: number; blob: Blob | null; body: unknown; fileName: string | null }> {
    const url = `/api/tenants/${encodeURIComponent(tenantId)}/integration-kit${format === 'zip' ? '' : `?format=${format}`}`;
    const response = await fetch(url, { credentials: 'same-origin' });

    if (!response.ok) {
        const body = await readJsonSafe(response);
        redirectIfSessionExpired(response.status, body);
        return { status: response.status, blob: null, body, fileName: null };
    }
    const disposition = response.headers.get('Content-Disposition') ?? '';
    const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition);
    return { status: response.status, blob: await response.blob(), body: null, fileName: match ? decodeURIComponent(match[1]) : null };
}
