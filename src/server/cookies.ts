import type { NextResponse } from 'next/server';
import { secondsToExpiry } from '@server/jwt-claims';

/**
 * Why: todo lo que antes guardaba el navegador en `sessionStorage` o dejaba en la URL vive acá, en cookies
 * `HttpOnly` que ningún script puede leer. Prefijo `__Host-`: exige `Secure`, `Path=/` y sin `Domain`.
 * `SameSite=Lax` y no `Strict`: la vuelta de Google y el link del correo son navegaciones desde otro sitio y
 * tienen que llegar con la cookie. El CSRF lo cubre `csrf.ts`.
 */

export const COOKIE = {
    access: '__Host-sa_at',
    refresh: '__Host-sa_rt',
    mfa: '__Host-sa_mfa',
    oauth: '__Host-sa_oauth',
    link: '__Host-sa_link',
} as const;

export const TTL_SECONDS = {
    access: 15 * 60,
    refresh: 7 * 24 * 60 * 60,
    mfa: 5 * 60,
    oauth: 10 * 60,
    link: 15 * 60,
} as const;

const BASE = { httpOnly: true, secure: true, sameSite: 'lax', path: '/' } as const;

export interface TokenPair {
    readonly access: string;
    readonly refresh: string | null;
    readonly refreshMaxAge: number | null;
}

export function setCookie(res: NextResponse, name: string, value: string, maxAgeSeconds: number): void {
    res.cookies.set(name, value, { ...BASE, maxAge: Math.max(1, Math.floor(maxAgeSeconds)) });
}

export function clearCookie(res: NextResponse, name: string): void {
    res.cookies.set(name, '', { ...BASE, maxAge: 0 });
}

/**
 * Guarda la sesión. La cookie del access vence con el token: sin access, el próximo pedido refresca.
 * Sin refresh nuevo se borra el anterior: ya no sirve (rotó) o es de otra sesión.
 */
export function writeSession(res: NextResponse, pair: TokenPair): void {
    const accessTtl = secondsToExpiry(pair.access) ?? TTL_SECONDS.access;
    setCookie(res, COOKIE.access, pair.access, accessTtl);
    if (pair.refresh) setCookie(res, COOKIE.refresh, pair.refresh, pair.refreshMaxAge ?? TTL_SECONDS.refresh);
    else clearCookie(res, COOKIE.refresh);
    clearCookie(res, COOKIE.mfa);
}

export function clearSession(res: NextResponse): void {
    clearCookie(res, COOKIE.access);
    clearCookie(res, COOKIE.refresh);
    clearCookie(res, COOKIE.mfa);
}

/* ── Token de un solo uso de un link del correo (reset, verificación, baja de 2FA) ── */

export type LinkKind = 'reset' | 'verify' | 'mfa-disable';

export interface LinkToken {
    readonly kind: LinkKind;
    readonly token: string;
    readonly tenantId: string | null;
}

const LINK_KINDS: readonly LinkKind[] = ['reset', 'verify', 'mfa-disable'];

export function encodeLink(link: LinkToken): string {
    return Buffer.from(JSON.stringify(link)).toString('base64url');
}

export function decodeLink(value: string | undefined): LinkToken | null {
    if (!value) return null;
    try {
        const parsed = JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as Partial<LinkToken>;
        if (!parsed.kind || !LINK_KINDS.includes(parsed.kind) || typeof parsed.token !== 'string' || !parsed.token) return null;
        return { kind: parsed.kind, token: parsed.token, tenantId: typeof parsed.tenantId === 'string' ? parsed.tenantId : null };
    } catch {
        return null;
    }
}
