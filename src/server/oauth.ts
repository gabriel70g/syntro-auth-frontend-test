import { randomBytes, timingSafeEqual } from 'node:crypto';

/**
 * Why: OAuth completo del lado del servidor. El `state` es aleatorio, viaja en una cookie HttpOnly atada a este
 * navegador y se compara a la vuelta; el `code` nunca pasa por JavaScript de la página.
 */

const PROVIDERS = {
    google: { authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth', scope: 'openid email profile' },
} as const;

export type OAuthProvider = keyof typeof PROVIDERS;

export interface OAuthStateCookie {
    readonly provider: OAuthProvider;
    readonly state: string;
    readonly tenantId: string | null;
}

export function isOAuthProvider(value: string | null | undefined): value is OAuthProvider {
    return !!value && Object.prototype.hasOwnProperty.call(PROVIDERS, value);
}

export function newOAuthState(): string {
    return randomBytes(32).toString('base64url');
}

export function callbackUrl(origin: string): string {
    return `${origin}/auth/callback`;
}

export function buildAuthorizeUrl(provider: OAuthProvider, clientId: string, redirectUri: string, state: string): string {
    const url = new URL(PROVIDERS[provider].authorizeUrl);
    url.searchParams.set('client_id', clientId);
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', PROVIDERS[provider].scope);
    url.searchParams.set('state', state);
    url.searchParams.set('access_type', 'offline');
    url.searchParams.set('prompt', 'select_account');
    return url.toString();
}

export function encodeOAuthState(value: OAuthStateCookie): string {
    return Buffer.from(JSON.stringify(value)).toString('base64url');
}

export function decodeOAuthState(value: string | undefined): OAuthStateCookie | null {
    if (!value) return null;
    try {
        const parsed = JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as Partial<OAuthStateCookie>;
        if (!isOAuthProvider(parsed.provider) || typeof parsed.state !== 'string' || !parsed.state) return null;
        return { provider: parsed.provider, state: parsed.state, tenantId: typeof parsed.tenantId === 'string' ? parsed.tenantId : null };
    } catch {
        return null;
    }
}

/** Comparación en tiempo constante. */
export function statesMatch(expected: string, received: string): boolean {
    const a = Buffer.from(expected);
    const b = Buffer.from(received);
    return a.length === b.length && timingSafeEqual(a, b);
}
