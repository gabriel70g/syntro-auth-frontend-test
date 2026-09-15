import { bffFetch } from '@common/api/clients/http.helpers';

/**
 * Why: Solo transporte HTTP; el mapeo ocurre fuera (puro). Los tokens que emite el backend los guarda el BFF en
 * cookies HttpOnly: estas respuestas llegan sin tokens.
 */

const post = async (path: string, body: unknown): Promise<{ ok: boolean; body: unknown }> => {
    const res = await bffFetch(path, { method: 'POST', body: JSON.stringify(body) });
    return { ok: res.ok, body: res.body };
};

export function postAuthLogin(body: { email: string; password: string }) {
    return post('/api/auth/login', body);
}

/** El token temporal del paso de 2FA lo agrega el BFF desde su cookie. */
export function postLogin2fa(body: { code: string }) {
    return post('/api/auth/login/2fa', body);
}

/**
 * Why: Solicitud de recuperación (anti-enumeración: el backend responde 200 genérico).
 */
export function postAuthForgotPassword(body: { email: string }) {
    return post('/api/auth/forgot-password', body);
}

/**
 * Why: Completa el reset; `newPassword` va cifrado con handshake RSA como login. El token del correo lo agrega el
 * BFF desde su cookie (nunca queda en la URL).
 */
export function postAuthResetPassword(body: { newPassword: string }) {
    return post('/api/auth/reset-password', body);
}

/** Why: Revoca el refresh en el backend y borra las cookies de sesión. */
export function postAuthLogout() {
    return post('/api/bff/logout', {});
}
