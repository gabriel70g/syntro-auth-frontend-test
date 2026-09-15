import { bffFetch } from '@common/api/clients/http.helpers';

/** El token y la empresa del link del correo los agrega el BFF desde su cookie. */
export async function postVerifyEmailConfirm(): Promise<{ ok: boolean; body: unknown }> {
    const res = await bffFetch('/api/auth/verify-email/confirm', { method: 'POST', body: '{}' });
    return { ok: res.ok, body: res.body };
}
