import { NextResponse, type NextRequest } from 'next/server';
import { appOrigin, uuidOrNull } from '@server/config';
import { COOKIE, TTL_SECONDS, encodeLink, setCookie, type LinkKind } from '@server/cookies';

/**
 * Why: corre antes de cada ruta.
 * 1. Headers de seguridad en todas las respuestas, y CSP con nonce por pedido en las páginas (Next aplica el
 *    nonce a sus scripts; `script-src` sin `unsafe-inline`).
 * 2. Tokens de un solo uso de los links del correo: pasan de la URL a una cookie HttpOnly y se redirige a la URL
 *    limpia, así el token no queda en el historial ni en el Referer.
 * 3. Páginas con sesión: sin cookie de sesión redirige a `/login` sin servir la pantalla. Es UI: la
 *    autorización la aplica el backend.
 */

const LINK_PAGES: Readonly<Record<string, LinkKind>> = {
    '/reset-password': 'reset',
    '/verify-email': 'verify',
    '/settings/security/mfa/disable-confirm': 'mfa-disable',
};
const SESSION_PAGES: readonly string[] = ['/tenant', '/admin/users', '/dashboard', '/settings/security/mfa'];
const MFA_PAGES: readonly string[] = ['/login/2fa', '/mfa/setup'];
const MAX_LINK_TOKEN_LENGTH = 2048;

function withSecurityHeaders(res: NextResponse): NextResponse {
    res.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains');
    res.headers.set('X-Content-Type-Options', 'nosniff');
    res.headers.set('Referrer-Policy', 'no-referrer');
    res.headers.set('X-Frame-Options', 'DENY');
    res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=()');
    res.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
    return res;
}

function contentSecurityPolicy(nonce: string): string {
    const isDev = process.env.NODE_ENV === 'development';
    const isHttps = (appOrigin() ?? '').startsWith('https://');
    return [
        `default-src 'self'`,
        `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ''}`,
        // React escribe atributos `style=`: los atributos no admiten nonce. Los estilos no ejecutan código.
        `style-src 'self' 'unsafe-inline'`,
        `img-src 'self' data: blob:`,
        `font-src 'self'`,
        `connect-src 'self'`,
        `object-src 'none'`,
        `base-uri 'none'`,
        `form-action 'self'`,
        `frame-ancestors 'none'`,
        ...(isHttps ? ['upgrade-insecure-requests'] : []),
    ].join('; ');
}

/**
 * Acá `req.nextUrl` trae el host del pedido (verificado en producción), así que sirve de fallback sin `APP_ORIGIN`.
 * No usar `redirectResponse`: con una `Location` relativa el proxy tira `ERR_INVALID_URL` y responde 500.
 */
function redirectTo(req: NextRequest, pathname: string, status: 303 | 307): NextResponse {
    return withSecurityHeaders(NextResponse.redirect(new URL(pathname, appOrigin() ?? req.nextUrl.origin), status));
}

export function proxy(request: NextRequest) {
    const { pathname, searchParams } = request.nextUrl;

    if (pathname.startsWith('/api/') || pathname === '/auth/callback' || pathname === '/health') {
        return withSecurityHeaders(NextResponse.next());
    }

    const linkKind = Object.hasOwn(LINK_PAGES, pathname) ? LINK_PAGES[pathname] : undefined;
    if (linkKind && searchParams.has('token')) {
        const res = redirectTo(request, pathname, 303);
        const token = searchParams.get('token')?.trim() ?? '';
        if (token && token.length <= MAX_LINK_TOKEN_LENGTH) {
            const tenantId = uuidOrNull(searchParams.get('tenantId'));
            setCookie(res, COOKIE.link, encodeLink({ kind: linkKind, token, tenantId }), TTL_SECONDS.link);
        }
        return res;
    }

    const hasSession = request.cookies.has(COOKIE.access) || request.cookies.has(COOKIE.refresh);
    if (SESSION_PAGES.includes(pathname) && !hasSession) return redirectTo(request, '/login', 307);
    if (MFA_PAGES.includes(pathname) && !request.cookies.has(COOKIE.mfa)) return redirectTo(request, '/login', 307);

    const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
    const csp = contentSecurityPolicy(nonce);
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-nonce', nonce);
    requestHeaders.set('Content-Security-Policy', csp);

    const res = NextResponse.next({ request: { headers: requestHeaders } });
    res.headers.set('Content-Security-Policy', csp);
    res.headers.set('Cache-Control', 'no-store');
    return withSecurityHeaders(res);
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|branding/).*)'],
};
