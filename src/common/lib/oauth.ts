import { getRedirectUri } from '@common/lib/config';

/**
 * Why: Funciones puras para URLs y validación de callback OAuth.
 */

export function buildOAuthUrl(
    provider: string,
    clientId: string,
    redirectUri: string,
    state?: string
): string {
    if (!provider || !clientId || !redirectUri) {
        throw new Error('Provider, clientId y redirectUri son requeridos');
    }

    const normalizedProvider = provider.toLowerCase();
    const encodedState = state ? encodeURIComponent(state) : encodeURIComponent(normalizedProvider);
    const encodedRedirectUri = encodeURIComponent(redirectUri);
    const encodedClientId = encodeURIComponent(clientId);

    const urlBuilders: Record<string, (params: OAuthUrlParams) => string> = {
        google: (params) =>
            `https://accounts.google.com/o/oauth2/v2/auth?` +
            `client_id=${params.clientId}&` +
            `redirect_uri=${params.redirectUri}&` +
            `response_type=code&` +
            `scope=openid email profile&` +
            `state=${params.state}&` +
            `access_type=offline&` +
            `prompt=select_account`,
    };

    const builder = urlBuilders[normalizedProvider];
    if (!builder) {
        throw new Error(`Proveedor OAuth no soportado: ${provider}`);
    }

    return builder({
        clientId: encodedClientId,
        redirectUri: encodedRedirectUri,
        state: encodedState,
    });
}

interface OAuthUrlParams {
    clientId: string;
    redirectUri: string;
    state: string;
}

type SearchParamsLike = { get(name: string): string | null };

export function parseOAuthCallback(searchParams: SearchParamsLike): OAuthCallbackParams {
    return {
        code: searchParams.get('code'),
        error: searchParams.get('error'),
        state: searchParams.get('state'),
    };
}

export interface OAuthCallbackParams {
    code: string | null;
    error: string | null;
    state: string | null;
}

export function validateOAuthCallback(params: OAuthCallbackParams): { valid: boolean; error?: string } {
    if (params.error) {
        return { valid: false, error: `Error de autenticación: ${params.error}` };
    }
    if (!params.code) {
        return { valid: false, error: 'No se recibió código de autorización' };
    }
    return { valid: true };
}

/** @deprecated Usar getRedirectUri() */
export function getCurrentRedirectUri(): string {
    return getRedirectUri();
}
