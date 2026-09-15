import { NextResponse, type NextRequest } from 'next/server';
import { callBackend, clientHeaders, readJson } from '@server/backend';
import { appOrigin, uuidOrNull } from '@server/config';
import { COOKIE, TTL_SECONDS, setCookie } from '@server/cookies';
import { isRecord } from '@server/envelope';
import { redirectResponse } from '@server/redirect';
import {
    buildAuthorizeUrl,
    callbackUrl,
    encodeOAuthState,
    isOAuthProvider,
    newOAuthState,
    type OAuthProvider,
} from '@server/oauth';

/**
 * Why: inicio de OAuth. Genera el `state`, lo ata a este navegador con una cookie HttpOnly y redirige al
 * proveedor. El `redirect_uri` sale de `APP_ORIGIN`, nunca del header Host.
 */

function clientIdFrom(body: unknown, provider: OAuthProvider): string | null {
    if (!isRecord(body) || !isRecord(body.data) || !isRecord(body.data.providers)) return null;
    const config = body.data.providers[provider];
    return isRecord(config) && config.enabled === true && typeof config.clientId === 'string' && config.clientId
        ? config.clientId
        : null;
}

export async function GET(req: NextRequest) {
    const origin = appOrigin();
    const toLogin = (code: string) => redirectResponse(`/login?error=${code}`, 303);

    const provider = req.nextUrl.searchParams.get('provider')?.toLowerCase() ?? null;
    if (!origin || !isOAuthProvider(provider)) return toLogin('oauth_config');

    const configRes = await callBackend('/api/auth/oauth/config', { method: 'GET', headers: clientHeaders(req) });
    const clientId = configRes?.ok ? clientIdFrom(await readJson(configRes), provider) : null;
    if (!clientId) return toLogin('oauth_config');

    const state = newOAuthState();
    const res = NextResponse.redirect(buildAuthorizeUrl(provider, clientId, callbackUrl(origin), state), 303);
    setCookie(
        res,
        COOKIE.oauth,
        encodeOAuthState({ provider, state, tenantId: uuidOrNull(req.nextUrl.searchParams.get('tenant')) }),
        TTL_SECONDS.oauth,
    );
    return res;
}
