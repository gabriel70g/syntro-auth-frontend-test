import { API_URL } from '@common/lib/config';
import { readJsonSafe } from '@common/api/clients/http.helpers';

export async function getOAuthConfig(): Promise<{ ok: boolean; body: unknown }> {
    const response = await fetch(`${API_URL}/api/auth/oauth/config`);
    return { ok: response.ok, body: await readJsonSafe(response) };
}
