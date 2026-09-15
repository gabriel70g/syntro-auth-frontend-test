import type { NextRequest } from 'next/server';
import { redirectResponse } from '@server/redirect';
import { homePathForRole } from '@common/lib/home-path';
import { callBackend, clientHeaders, readJson, refreshFromSetCookie } from '@server/backend';
import { appOrigin, defaultTenantId } from '@server/config';
import { COOKIE, TTL_SECONDS, clearCookie, setCookie, writeSession } from '@server/cookies';
import { isRecord, stripTokens } from '@server/envelope';
import { roleOf } from '@server/jwt-claims';
import { callbackUrl, decodeOAuthState, statesMatch } from '@server/oauth';

/**
 * Why: vuelta del proveedor OAuth, resuelta entera en el servidor. Rechaza el callback si el `state` no es el que
 * se guardó en este navegador (anti login forzado), intercambia el `code` con SyntroAuth server-to-server y
 * redirige a una URL limpia: el `code` no queda en el historial ni pasa por JavaScript.
 */
export async function GET(req: NextRequest) {
    const origin = appOrigin();
    const redirect = (path: string) => {
        const res = redirectResponse(path, 303);
        clearCookie(res, COOKIE.oauth); // un solo uso, salga bien o mal
        return res;
    };

    const params = req.nextUrl.searchParams;
    const code = params.get('code');
    const state = params.get('state');
    const saved = decodeOAuthState(req.cookies.get(COOKIE.oauth)?.value);

    if (!origin) return redirect('/login?error=oauth_config');
    if (params.get('error') || !code || !state) return redirect('/login?error=oauth');
    if (!saved || !statesMatch(saved.state, state)) return redirect('/login?error=oauth_state');

    const backendRes = await callBackend('/api/auth/oauth/login', {
        method: 'POST',
        headers: {
            ...clientHeaders(req),
            'content-type': 'application/json',
            'x-tenant-id': saved.tenantId ?? defaultTenantId(),
        },
        body: JSON.stringify({ provider: saved.provider, code, redirectUri: callbackUrl(origin) }),
    });
    if (!backendRes) return redirect('/login?error=oauth_unavailable');

    const { body, tokens } = stripTokens(await readJson(backendRes));
    if (!backendRes.ok) return redirect('/login?error=oauth');

    if (tokens.tempToken) {
        const setupRequired = isRecord(body) && isRecord(body.data) && body.data.message === 'SETUP_REQUIRED';
        const res = redirect(setupRequired ? '/mfa/setup' : '/login/2fa');
        setCookie(res, COOKIE.mfa, tokens.tempToken, TTL_SECONDS.mfa);
        return res;
    }
    if (!tokens.access) return redirect('/login?error=oauth');

    const fromCookie = refreshFromSetCookie(backendRes);
    const res = redirect(homePathForRole(roleOf(tokens.access)));
    writeSession(res, { access: tokens.access, refresh: fromCookie?.value ?? tokens.refresh, refreshMaxAge: fromCookie?.maxAge ?? null });
    return res;
}
