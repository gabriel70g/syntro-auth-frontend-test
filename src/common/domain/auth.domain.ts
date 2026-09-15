/**
 * Why: View models del frontend desacoplados del contrato JSON del backend (ACL).
 */

export interface AuthCredentials {
    readonly email: string;
    readonly password: string;
    /** Nombre de la empresa (tenant). Vacío = tenant default. */
    readonly tenantName: string;
}

export interface RegisterData {
    readonly email: string;
    readonly password: string;
    /** Nombre de la empresa: syntroAuth crea el tenant y deja al usuario como dueño. */
    readonly companyName: string;
}

/** Sesión vista desde la UI. Los tokens viven en cookies HttpOnly del BFF: acá no hay ninguno. */
export interface AuthSession {
    readonly role?: string;
}

export interface LoginResult {
    readonly success: boolean;
    readonly session?: AuthSession;
    readonly error?: string;
    readonly mfaRequired?: boolean;
    readonly message?: string;
}

export type OAuthProviderView = {
    readonly enabled: boolean;
    readonly clientId: string | null;
};
