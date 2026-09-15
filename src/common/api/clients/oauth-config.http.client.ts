import { bffFetch } from '@common/api/clients/http.helpers';

export async function getOAuthConfig(): Promise<{ ok: boolean; body: unknown }> {
    const res = await bffFetch('/api/auth/oauth/config', { method: 'GET' });
    return { ok: res.ok, body: res.body };
}
