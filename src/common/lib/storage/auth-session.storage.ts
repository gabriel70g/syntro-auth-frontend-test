import type { AuthSession } from '@common/domain/auth.domain';

/**
 * Why: Access token en sessionStorage — sobrevive refresh/navegación pero no persiste entre tabs
 * ni entre sesiones del browser. Suficiente para una demo; en prod sería solo en memoria.
 */

const ACCESS_TOKEN_KEY = 'auth_token';

export function writeAuthSessionToStorage(session: AuthSession): void {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem(ACCESS_TOKEN_KEY, session.token);
}

export function clearAuthSessionStorage(): void {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
}

export function readStoredAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem(ACCESS_TOKEN_KEY);
}

export function writeAccessToken(token: string): void {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem(ACCESS_TOKEN_KEY, token);
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
