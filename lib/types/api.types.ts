/**
 * Contrato estándar de API Backend (Railway)
 * Este es el formato que devuelve el backend
 */

/**
 * Respuesta de error del backend
 */
export interface ApiErrorResponse {
    success: false;
    statusCode: number;
    error: {
        code: string;
        message: string;
    };
}

/**
 * Respuesta exitosa del backend
 */
export interface ApiSuccessResponse<T> {
    success: true;
    statusCode: number;
    data: T;
}

/**
 * Respuesta genérica de la API (puede ser éxito o error)
 */
export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Payload que devuelve el backend en /auth/login
 */
export interface ApiLoginSuccessResponse {
    accessToken: string;
    refreshToken: string;
    accessTokenExpiresAt: string;
    tokenType: string;
}

export interface ApiMfaRequiredResponse {
    result: 'mfa_required';
    tempToken: string;
    message: string;
}

export type ApiLoginResponse = ApiLoginSuccessResponse | ApiMfaRequiredResponse;

export interface ApiMfaSetupResponse {
    secret: string;
    qrCodeUri: string;
    manualEntryKey: string;
}
