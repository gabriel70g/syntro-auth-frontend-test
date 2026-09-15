import type { LoginResult } from '@common/domain/auth.domain';
import { mapUnknownToErrorMessage } from '@common/api/mappers/error-message.mapper';
import { isRecord } from '@common/api/mappers/json-guards';

/**
 * Why: Traduce la respuesta del BFF a login / login 2FA a modelo de dominio (puro). El BFF ya guardó los tokens
 * en cookies: la respuesta trae `authenticated` + `role`, o `result: 'mfa_required'`.
 */
export function mapLoginResponseBodyToResult(httpOk: boolean, body: unknown): LoginResult {
    if (!httpOk) {
        return { success: false, error: mapUnknownToErrorMessage(body, 'Error de red') };
    }

    if (!isRecord(body) || body.success !== true || !isRecord(body.data)) {
        return { success: false, error: mapUnknownToErrorMessage(body, 'Respuesta inválida') };
    }

    const data = body.data;

    if (data.result === 'mfa_required') {
        return {
            success: true,
            mfaRequired: true,
            message: typeof data.message === 'string' ? data.message : undefined,
        };
    }

    if (data.authenticated === true) {
        return { success: true, session: { role: typeof data.role === 'string' ? data.role : undefined } };
    }

    return { success: false, error: 'Respuesta del servidor inválida' };
}
