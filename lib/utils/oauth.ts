/**
 * Utilidades OAuth - Demo/Maqueta SyntroAuth
 * 
 * Funciones puras (programación funcional) para manejo de OAuth:
 * - Construcción de URLs de autorización
 * - Parsing de callbacks
 * - Validación de parámetros
 * 
 * Arquitectura:
 * - Single Responsibility: cada función hace una cosa
 * - Programación Funcional: funciones puras sin side effects
 * - Guard Clauses: validación temprana
 * 
 * Configurado para Railway por defecto (NEXT_PUBLIC_REDIRECT_URI).
 * Localhost solo como fallback si es necesario.
 */

/**
 * Construye la URL de autorización OAuth para un proveedor
 * Función pura: sin side effects, siempre retorna el mismo resultado para los mismos inputs
 */
export function buildOAuthUrl(
    provider: string,
    clientId: string,
    redirectUri: string,
    state?: string
): string {
    // Guard clause: provider requerido
    if (!provider || !clientId || !redirectUri) {
        throw new Error('Provider, clientId y redirectUri son requeridos');
    }

    const normalizedProvider = provider.toLowerCase();
    const encodedState = state ? encodeURIComponent(state) : encodeURIComponent(normalizedProvider);
    const encodedRedirectUri = encodeURIComponent(redirectUri);
    const encodedClientId = encodeURIComponent(clientId);

    // Strategy pattern: cada proveedor tiene su propia construcción de URL
    // Open/Closed: fácil agregar nuevos proveedores sin modificar esta función
    const urlBuilders: Record<string, (params: OAuthUrlParams) => string> = {
        google: (params) =>
            `https://accounts.google.com/o/oauth2/v2/auth?` +
            `client_id=${params.clientId}&` +
            `redirect_uri=${params.redirectUri}&` +
            `response_type=code&` +
            `scope=openid email profile&` +
            `state=${params.state}&` +
            `access_type=offline&` +
            `prompt=consent`,
    };

    const builder = urlBuilders[normalizedProvider];
    
    // Guard clause: proveedor no soportado
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

/**
 * Extrae parámetros de la URL de callback OAuth
 * Función pura: transforma URL params → objeto
 * 
 * Compatible con:
 * - Next.js useSearchParams() (ReadonlyURLSearchParams)
 * - Static export (URLSearchParams desde window.location.search)
 * - Cualquier objeto con método get()
 */
type SearchParamsLike = {
    get(name: string): string | null;
};

export function parseOAuthCallback(searchParams: SearchParamsLike): OAuthCallbackParams {
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const state = searchParams.get('state');

    return {
        code: code ?? null,
        error: error ?? null,
        state: state ?? null,
    };
}

export interface OAuthCallbackParams {
    code: string | null;
    error: string | null;
    state: string | null;
}

/**
 * Valida parámetros de callback OAuth
 * Función pura: validación sin side effects
 */
export function validateOAuthCallback(params: OAuthCallbackParams): {
    valid: boolean;
    error?: string;
} {
    // Guard clause: error de OAuth provider
    if (params.error) {
        return {
            valid: false,
            error: `Error de autenticación: ${params.error}`,
        };
    }

    // Guard clause: código requerido
    if (!params.code) {
        return {
            valid: false,
            error: 'No se recibió código de autorización',
        };
    }

    return { valid: true };
}

/**
 * Obtiene el redirect URI actual
 * @deprecated Usar getRedirectUri() de @/lib/constants/config en su lugar
 * Mantenido por compatibilidad hacia atrás
 */
export function getCurrentRedirectUri(): string {
    // Re-exportar desde config para mantener compatibilidad
    const { getRedirectUri } = require('@/lib/constants/config');
    return getRedirectUri();
}
