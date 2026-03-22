import type { AuthSession } from '@common/domain/auth.domain';

/**
 * Why: Efectos de persistencia aislados; el dominio y los mapeadores permanecen puros.
 */

export function writeAuthSessionToStorage(session: AuthSession): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('auth_token', session.token);
    // Refresh en cookie HttpOnly (API); no persistir en localStorage.
}

export function clearAuthSessionStorage(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
}

export function readStoredAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('auth_token');
}

export function storeMfaTempToken(token: string): void {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem('mfa_temp_token', token);
}

export function readMfaTempToken(): string | null {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem('mfa_temp_token');
}

export function clearMfaTempToken(): void {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem('mfa_temp_token');
}

export function storeOAuthRedirectUri(redirectUri: string): void {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem('oauth_redirect_uri', redirectUri);
}

export function readAndClearOAuthRedirectUri(): string | null {
    if (typeof window === 'undefined') return null;
    const v = sessionStorage.getItem('oauth_redirect_uri');
    if (v) sessionStorage.removeItem('oauth_redirect_uri');
    return v;
}
