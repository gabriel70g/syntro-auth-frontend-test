import type { AuthSession } from '@common/domain/auth.domain';

/**
 * Why: Access token solo en memoria (nunca localStorage) — más seguro contra XSS.
 * El refresh token viaja en cookie HttpOnly gestionada por el backend.
 */

let inMemoryAccessToken: string | null = null;

export function writeAuthSessionToStorage(session: AuthSession): void {
    inMemoryAccessToken = session.token;
}

export function clearAuthSessionStorage(): void {
    inMemoryAccessToken = null;
}

export function readStoredAccessToken(): string | null {
    return inMemoryAccessToken;
}

export function writeAccessToken(token: string): void {
    inMemoryAccessToken = token;
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
