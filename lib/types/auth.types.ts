/**
 * MODELOS DE DOMINIO (ACL)
 * Estos son los modelos internos del frontend, desacoplados del backend
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
}
