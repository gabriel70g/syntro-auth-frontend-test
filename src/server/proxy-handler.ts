import { NextResponse, type NextRequest } from 'next/server';
import { callBackend, clientHeaders, readJson, refreshFromSetCookie } from '@server/backend';
import {
    COOKIE,
    TTL_SECONDS,
    clearCookie,
    clearSession,
    decodeLink,
    setCookie,
    writeSession,
    type TokenPair,
} from '@server/cookies';
import { isSafeMethod } from '@server/csrf';
import { bffError, isRecord, stripTokens, type CapturedTokens } from '@server/envelope';
import { roleOf, secondsToExpiry } from '@server/jwt-claims';
import type { RouteRule } from '@server/routes';
import { resolveAccess } from '@server/session';

/**
 * Why: un pedido del navegador a `/api/*` → el mismo pedido al backend, con la credencial que corresponde
 * sacada de cookies HttpOnly, y la respuesta de vuelta sin tokens. Los tokens que emite el backend se guardan
 * en cookies acá y nunca llegan al JavaScript de la página.
 */

const MAX_BODY_BYTES = 64 * 1024;
const PASSTHROUGH_RESPONSE_HEADERS = ['content-type', 'content-disposition', 'x-correlation-id', 'retry-after'];

type Prepared =
    | { readonly kind: 'ok'; readonly headers: Record<string, string>; readonly body: string | null }
    | { readonly kind: 'error'; readonly response: NextResponse };

export function sessionExpired(): NextResponse {
    const res = bffError(401, 'SESSION_EXPIRED', 'Tu sesión venció. Volvé a iniciar sesión.');
    clearSession(res);
    return res;
}

function mfaExpired(): NextResponse {
    return bffError(401, 'MFA_SESSION_EXPIRED', 'El paso de verificación venció. Volvé a iniciar sesión.');
}

function withJsonField(body: string | null, field: string, value: string): string | null {
    let parsed: unknown = {};
    if (body) {
        try {
            parsed = JSON.parse(body);
        } catch {
            return null;
        }
    }
    return isRecord(parsed) ? JSON.stringify({ ...parsed, [field]: value }) : null;
}

async function prepareRequest(req: NextRequest, rule: RouteRule): Promise<Prepared> {
    const headers = clientHeaders(req);
    let body: string | null = null;

    if (!isSafeMethod(req.method)) {
        const raw = await req.text();
        if (Buffer.byteLength(raw) > MAX_BODY_BYTES) {
            return { kind: 'error', response: bffError(413, 'PAYLOAD_TOO_LARGE', 'El pedido es demasiado grande.') };
        }
        body = raw || null;
    }

    if (rule.inject === 'mfa-temp-token') {
        const temp = req.cookies.get(COOKIE.mfa)?.value;
        if (!temp) return { kind: 'error', response: mfaExpired() };
        body = withJsonField(body, 'tempToken', temp);
    } else if (rule.inject !== 'none') {
        const link = decodeLink(req.cookies.get(COOKIE.link)?.value);
        if (!link || `link:${link.kind}` !== rule.inject) {
            return { kind: 'error', response: bffError(400, 'LINK_TOKEN_MISSING', 'El enlace no es válido o ya se usó. Pedí uno nuevo.') };
        }
        body = withJsonField(body, 'token', link.token);
        if (link.tenantId) headers['x-tenant-id'] = link.tenantId;
    }

    if (rule.inject !== 'none' && body === null) {
        return { kind: 'error', response: bffError(400, 'INVALID_REQUEST', 'El cuerpo del pedido no es JSON válido.') };
    }
    if (body !== null) headers['content-type'] = 'application/json';
    return { kind: 'ok', headers, body };
}

/**
 * 401 del esquema Bearer (token vencido, inválido o revocado): trae `WWW-Authenticate` y el backend no procesó el
 * pedido, así que se puede refrescar y reintentar. Un 401 de negocio (código TOTP incorrecto) no lo trae y NO se
 * reintenta: reenviar el código lo consumiría dos veces.
 */
function isBearerRejection(res: Response): boolean {
    return res.status === 401 && res.headers.has('www-authenticate');
}

function withSessionInfo(body: unknown, access: string | null): unknown {
    if (!access || !isRecord(body) || !isRecord(body.data)) return body;
    return { ...body, data: { ...body.data, authenticated: true, role: roleOf(access) ?? null } };
}

function captureTokens(res: NextResponse, rule: RouteRule, tokens: CapturedTokens, backendRes: Response): void {
    if (rule.capture === 'login') {
        if (tokens.access) {
            const fromCookie = refreshFromSetCookie(backendRes);
            writeSession(res, {
                access: tokens.access,
                refresh: fromCookie?.value ?? tokens.refresh,
                refreshMaxAge: fromCookie?.maxAge ?? null,
            });
        } else if (tokens.tempToken) {
            setCookie(res, COOKIE.mfa, tokens.tempToken, TTL_SECONDS.mfa);
        }
        return;
    }
    if (rule.capture === 'access' && tokens.access) {
        setCookie(res, COOKIE.access, tokens.access, secondsToExpiry(tokens.access) ?? TTL_SECONDS.access);
    }
}

async function toBrowserResponse(backendRes: Response, rule: RouteRule, rotated: TokenPair | null): Promise<NextResponse> {
    const headers = new Headers({ 'Cache-Control': 'no-store' });
    for (const name of PASSTHROUGH_RESPONSE_HEADERS) {
        const value = backendRes.headers.get(name);
        if (value) headers.set(name, value);
    }

    let res: NextResponse;
    let tokens: CapturedTokens = { access: null, refresh: null, tempToken: null };
    if ((backendRes.headers.get('content-type') ?? '').includes('json')) {
        const stripped = stripTokens(await readJson(backendRes));
        tokens = stripped.tokens;
        const body = withSessionInfo(stripped.body, rule.capture === 'none' ? null : tokens.access);
        res = body === null
            ? new NextResponse(null, { status: backendRes.status, headers })
            : NextResponse.json(body, { status: backendRes.status, headers });
    } else {
        // Binario (kit de integración) o texto (clave pública PEM): pasa tal cual.
        res = new NextResponse(backendRes.body, { status: backendRes.status, headers });
    }

    // Orden: primero la rotación de este pedido, después lo que emitió el endpoint (step-up pisa el access).
    if (rotated) writeSession(res, rotated);
    if (backendRes.ok) {
        captureTokens(res, rule, tokens, backendRes);
        if (rule.inject.startsWith('link:')) clearCookie(res, COOKIE.link);
    }
    return res;
}

export async function proxyToBackend(req: NextRequest, backendPath: string, rule: RouteRule): Promise<NextResponse> {
    const prepared = await prepareRequest(req, rule);
    if (prepared.kind === 'error') return prepared.response;

    const path = `${backendPath}${req.nextUrl.search}`;
    const send = (bearer: string | null) =>
        callBackend(path, {
            method: req.method,
            headers: bearer ? { ...prepared.headers, authorization: `Bearer ${bearer}` } : prepared.headers,
            body: prepared.body,
        });

    let rotated: TokenPair | null = null;
    let backendRes: Response | null;

    if (rule.auth === 'mfa') {
        const temp = req.cookies.get(COOKIE.mfa)?.value;
        if (!temp) return mfaExpired();
        backendRes = await send(temp);
    } else if (rule.auth === 'session') {
        const session = await resolveAccess(req);
        if (session.kind === 'none') return sessionExpired();
        if (session.kind === 'unavailable') {
            return bffError(503, 'SESSION_UNAVAILABLE', 'No se pudo validar la sesión. Probá de nuevo en unos segundos.');
        }
        rotated = session.rotated;
        backendRes = await send(session.access);

        if (backendRes && isBearerRejection(backendRes) && !rotated) {
            const retry = await resolveAccess(req, { forceRefresh: true });
            if (retry.kind === 'none') return sessionExpired();
            if (retry.kind === 'ok') {
                rotated = retry.rotated;
                backendRes = await send(retry.access);
            }
        }
    } else {
        backendRes = await send(null);
    }

    if (!backendRes) {
        return bffError(502, 'BACKEND_UNAVAILABLE', 'El servicio de autenticación no responde. Probá de nuevo en unos segundos.');
    }
    return toBrowserResponse(backendRes, rule, rotated);
}
