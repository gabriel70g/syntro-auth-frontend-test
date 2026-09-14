import { authenticatedFetch } from '@common/api/clients/http.helpers';
import type { ApplicationDraft } from '@common/domain/application.domain';

/**
 * Why: Transporte de /api/tenants/{id}/applications. El mapeo a dominio vive en application.mapper.ts.
 */

const base = (tenantId: string) => `/api/tenants/${encodeURIComponent(tenantId)}/applications`;
const one = (tenantId: string, appId: string) => `${base(tenantId)}/${encodeURIComponent(appId)}`;

export async function listApplications(tenantId: string) {
    const res = await authenticatedFetch(base(tenantId), { method: 'GET' });
    return { status: res.status, body: res.body };
}

export async function createApplication(tenantId: string, draft: ApplicationDraft) {
    const res = await authenticatedFetch(base(tenantId), { method: 'POST', body: JSON.stringify(draft) });
    return { status: res.status, body: res.body };
}

/** PATCH parcial: lo que no se manda no cambia. */
export async function updateApplication(
    tenantId: string,
    appId: string,
    patch: { readonly name?: string; readonly allowedOrigins?: readonly string[]; readonly isActive?: boolean },
) {
    const res = await authenticatedFetch(one(tenantId, appId), { method: 'PATCH', body: JSON.stringify(patch) });
    return { status: res.status, body: res.body };
}

export async function deleteApplication(tenantId: string, appId: string) {
    const res = await authenticatedFetch(one(tenantId, appId), { method: 'DELETE' });
    return { status: res.status, body: res.body };
}
