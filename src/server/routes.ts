/**
 * Why: el proxy `/api/*` no es un proxy abierto. Solo pasan las rutas del backend que usa esta app, con el
 * método exacto, y cada una declara qué credencial lleva y qué tokens hay que capturar de su respuesta.
 * `/api/auth/refresh`, `/api/auth/logout` y `/api/auth/oauth/login` NO están: esos los hace solo el servidor.
 */

/** none: sin credencial · session: access token de la sesión · mfa: token temporal del paso de 2FA. */
export type RouteAuth = 'none' | 'session' | 'mfa';
/** login: access + refresh o token temporal · access: solo access (step-up elevado). */
export type RouteCapture = 'none' | 'login' | 'access';
export type RouteInject = 'none' | 'mfa-temp-token' | 'link:reset' | 'link:verify' | 'link:mfa-disable';

export interface RouteRule {
    readonly method: string;
    readonly pattern: RegExp;
    readonly auth: RouteAuth;
    readonly capture: RouteCapture;
    readonly inject: RouteInject;
}

function rule(
    method: string,
    template: string,
    auth: RouteAuth,
    options: { capture?: RouteCapture; inject?: RouteInject } = {},
): RouteRule {
    const source = template
        .split('/')
        .map((part) => (part === ':id' ? '[^/]+' : part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
        .join('/');
    return { method, pattern: new RegExp(`^${source}$`), auth, capture: options.capture ?? 'none', inject: options.inject ?? 'none' };
}

const RULES: readonly RouteRule[] = [
    rule('GET', '/api/auth/security/public-key', 'none'),
    rule('GET', '/api/auth/oauth/config', 'none'),
    rule('POST', '/api/auth/login', 'none', { capture: 'login' }),
    rule('POST', '/api/auth/login/2fa', 'none', { capture: 'login', inject: 'mfa-temp-token' }),
    rule('POST', '/api/auth/forgot-password', 'none'),
    rule('POST', '/api/auth/reset-password', 'none', { inject: 'link:reset' }),
    rule('POST', '/api/auth/verify-email/confirm', 'none', { capture: 'login', inject: 'link:verify' }),
    rule('POST', '/api/auth/mfa/setup', 'mfa'),
    rule('POST', '/api/auth/mfa/enable', 'mfa'),
    rule('POST', '/api/auth/mfa/disable/confirm', 'none', { inject: 'link:mfa-disable' }),
    rule('POST', '/api/auth/step-up/challenge', 'session'),
    rule('POST', '/api/auth/step-up/verify', 'session', { capture: 'access' }),

    rule('POST', '/api/tenants/register', 'none'),
    rule('GET', '/api/tenants/by-name/:id', 'none'),
    rule('GET', '/api/tenants/mine', 'session'),
    rule('POST', '/api/tenants', 'session'),
    rule('GET', '/api/tenants/:id/integration-kit', 'session'),
    rule('GET', '/api/tenants/:id/applications', 'session'),
    rule('POST', '/api/tenants/:id/applications', 'session'),
    rule('PATCH', '/api/tenants/:id/applications/:id', 'session'),
    rule('DELETE', '/api/tenants/:id/applications/:id', 'session'),

    rule('POST', '/api/account/mfa/setup', 'session'),
    rule('POST', '/api/account/mfa/confirm-sync', 'session'),
    rule('POST', '/api/account/mfa/verify', 'session'),
    rule('POST', '/api/account/mfa/disable/request', 'session'),

    rule('GET', '/api/users', 'session'),
    rule('POST', '/api/admin/users/:id/revoke', 'session'),
    rule('PATCH', '/api/users/:id/flags', 'session'),
    rule('DELETE', '/api/users/:id', 'session'),
];

/**
 * Segmentos del catch-all → path del backend. Next ya los decodificó: se rechaza lo que podría escapar de
 * `/api/` (vacíos, `.`, `..`, barras) y se vuelven a codificar.
 */
export function toBackendPath(segments: readonly string[]): string | null {
    if (segments.length === 0) return null;
    for (const segment of segments) {
        if (!segment || segment === '.' || segment === '..' || /[\\/]/.test(segment)) return null;
    }
    return `/api/${segments.map(encodeURIComponent).join('/')}`;
}

export function matchRoute(method: string, backendPath: string): RouteRule | null {
    return RULES.find((r) => r.method === method && r.pattern.test(backendPath)) ?? null;
}
