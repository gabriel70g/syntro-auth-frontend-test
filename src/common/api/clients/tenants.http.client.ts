import { API_URL, API_FETCH_CREDENTIALS } from '@common/lib/config';
import { authenticatedFetch, readJsonSafe, refreshAccessToken } from '@common/api/clients/http.helpers';
import { readStoredAccessToken } from '@common/lib/storage/auth-session.storage';
import type { KitFormat } from '@common/domain/tenant.domain';

/**
 * Why: Transporte de /api/tenants. El mapeo a dominio vive en tenant.mapper.ts.
 */

const JSON_HEADERS = { 'Content-Type': 'application/json' };

/** Signup anónimo: empresa + usuario dueño. `password` ya viene cifrada con el handshake RSA. */
export async function postRegisterTenant(body: { tenantName: string; email: string; password: string }) {
    const response = await fetch(`${API_URL}/api/tenants/register`, {
        method: 'POST',
        credentials: API_FETCH_CREDENTIALS,
        headers: JSON_HEADERS,
        body: JSON.stringify({
            tenant: { name: body.tenantName },
            user: { email: body.email, password: body.password, provider: 'email' },
        }),
    });
    return { status: response.status, body: await readJsonSafe(response) };
}

export async function getTenantByName(name: string) {
    const response = await fetch(`${API_URL}/api/tenants/by-name/${encodeURIComponent(name)}`, {
        credentials: API_FETCH_CREDENTIALS,
    });
    return { status: response.status, body: await readJsonSafe(response) };
}

export async function getMyTenant() {
    const res = await authenticatedFetch('/api/tenants/mine', { method: 'GET' });
    return { status: res.status, body: res.body };
}

export async function postCreateTenant(name: string) {
    const res = await authenticatedFetch('/api/tenants', { method: 'POST', body: JSON.stringify({ name }) });
    return { status: res.status, body: res.body };
}

/** Descarga binaria del kit con Bearer; un 401 dispara un único refresh y reintenta. */
export async function fetchIntegrationKit(
    tenantId: string,
    format: KitFormat,
): Promise<{ status: number; blob: Blob | null; body: unknown; fileName: string | null }> {
    const url = `${API_URL}/api/tenants/${encodeURIComponent(tenantId)}/integration-kit${format === 'zip' ? '' : `?format=${format}`}`;
    const attempt = (token: string | null) =>
        fetch(url, {
            credentials: API_FETCH_CREDENTIALS,
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

    let response = await attempt(readStoredAccessToken());
    if (response.status === 401) {
        const refreshed = await refreshAccessToken();
        if (refreshed) response = await attempt(refreshed);
    }

    if (!response.ok) {
        return { status: response.status, blob: null, body: await readJsonSafe(response), fileName: null };
    }
    const disposition = response.headers.get('Content-Disposition') ?? '';
    const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition);
    return { status: response.status, blob: await response.blob(), body: null, fileName: match ? decodeURIComponent(match[1]) : null };
}
