/**
 * Why: Forma cruda del backend (sin usarla directamente en componentes).
 */

export interface ApiErrorPayload {
    code: string;
    message: string;
}

export interface ApiErrorResponse {
    success: false;
    statusCode: number;
    error: ApiErrorPayload;
}

export interface ApiSuccessResponse<T> {
    success: true;
    statusCode: number;
    data: T;
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface ApiLoginSuccessData {
    accessToken: string;
    refreshToken: string;
    accessTokenExpiresAt: string;
    tokenType: string;
}

export interface ApiMfaRequiredData {
    result: 'mfa_required';
    tempToken: string;
    message: string;
}

export type ApiLoginData = ApiLoginSuccessData | ApiMfaRequiredData;

export interface ApiMfaSetupData {
    secret: string;
    qrCodeUri: string;
    manualEntryKey: string;
}

/** Cuerpo de PasswordRecoveryResponse (camelCase desde el API). */
export interface ApiPasswordRecoveryData {
    message: string;
    debugToken?: string | null;
}
