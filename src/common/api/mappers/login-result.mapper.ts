import type { LoginResult, OAuthLoginResult } from '@common/domain/auth.domain';
import type { ApiLoginData, ApiSuccessResponse } from '@common/api/raw/envelope.types';
import { mapUnknownToErrorMessage } from '@common/api/mappers/error-message.mapper';
import { mapAccessTokenPairToAuthSession } from '@common/api/mappers/auth-session.mapper';
import { isRecord } from '@common/api/mappers/json-guards';

function isApiSuccessEnvelope(body: unknown): body is ApiSuccessResponse<ApiLoginData> {
    return isRecord(body) && body.success === true && 'data' in body;
}

function isMfaRequiredData(data: unknown): data is { result: 'mfa_required'; tempToken: string; message: string } {
    return (
        isRecord(data) &&
        data.result === 'mfa_required' &&
        typeof data.tempToken === 'string' &&
        typeof data.message === 'string'
    );
}

function isLoginSuccessData(data: unknown): data is {
    accessToken: string;
    refreshToken: string;
} {
    return (
        isRecord(data) &&
        typeof data.accessToken === 'string' &&
        typeof data.refreshToken === 'string'
    );
}

/**
 * Why: Traduce cuerpo JSON de login/OAuth login a modelo de dominio (puro).
 */
export function mapLoginResponseBodyToResult(httpOk: boolean, body: unknown): LoginResult {
    if (!httpOk) {
        return { success: false, error: mapUnknownToErrorMessage(body, 'Error de red') };
    }

    if (!isApiSuccessEnvelope(body)) {
        return { success: false, error: mapUnknownToErrorMessage(body, 'Respuesta inválida') };
    }

    const data = body.data;

    if (isMfaRequiredData(data)) {
        return {
            success: true,
            mfaRequired: true,
            tempToken: data.tempToken,
            message: data.message,
        };
    }

    if (isLoginSuccessData(data)) {
        const session = mapAccessTokenPairToAuthSession(data.accessToken, data.refreshToken);
        if (!session) {
            return { success: false, error: 'Respuesta del servidor inválida' };
        }
        return { success: true, session };
    }

    return { success: false, error: 'Respuesta del servidor inválida' };
}

export function mapOAuthLoginResponseBodyToResult(httpOk: boolean, body: unknown): OAuthLoginResult {
    return mapLoginResponseBodyToResult(httpOk, body);
}
