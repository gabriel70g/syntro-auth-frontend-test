/**
 * Why: View models del frontend desacoplados del contrato JSON del backend (ACL).
 */

export interface User {
    readonly id: string;
    readonly email: string;
    readonly name: string;
    readonly role?: string;
}

export interface AuthCredentials {
    readonly email: string;
    readonly password: string;
}

export interface RegisterData {
    readonly email: string;
    readonly password: string;
    readonly name: string;
}

export interface AuthSession {
    readonly token: string;
    readonly refreshToken?: string;
    readonly user: User;
}

export interface LoginResult {
    readonly success: boolean;
    readonly session?: AuthSession;
    readonly error?: string;
    readonly mfaRequired?: boolean;
    readonly tempToken?: string;
    readonly message?: string;
}

export interface RegisterResult {
    readonly success: boolean;
    readonly session?: AuthSession;
    readonly error?: string;
}

export interface OAuthLoginRequest {
    readonly provider: string;
    readonly code: string;
    readonly redirectUri: string;
}

export interface OAuthLoginResult {
    readonly success: boolean;
    readonly session?: AuthSession;
    readonly error?: string;
    readonly mfaRequired?: boolean;
    readonly tempToken?: string;
    readonly message?: string;
}

export type OAuthProviderView = {
    readonly enabled: boolean;
    readonly clientId: string | null;
};
