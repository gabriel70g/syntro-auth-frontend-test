import { API_URL, API_FETCH_CREDENTIALS, getDefaultHeaders } from '@common/lib/config';
import { readJsonSafe } from '@common/api/clients/http.helpers';

export async function postCreateUser(body: { email: string; password: string }): Promise<{
    ok: boolean;
    body: unknown;
}> {
    const response = await fetch(`${API_URL}/api/users`, {
        method: 'POST',
        credentials: API_FETCH_CREDENTIALS,
        headers: getDefaultHeaders(),
        body: JSON.stringify(body),
    });
    return { ok: response.ok, body: await readJsonSafe(response) };
}
