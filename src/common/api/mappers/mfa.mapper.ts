import type { MfaConfirmOutcome, MfaSetupOutcome } from '@common/domain/mfa.domain';
import type { ApiMfaSetupData, ApiSuccessResponse } from '@common/api/raw/envelope.types';
import { mapUnknownToErrorMessage } from '@common/api/mappers/error-message.mapper';
import { isRecord } from '@common/api/mappers/json-guards';

function isMfaSetupSuccess(body: unknown): body is ApiSuccessResponse<ApiMfaSetupData> {
    return isRecord(body) && body.success === true && isRecord(body.data);
}

/**
 * Why: Respuesta de setup MFA → modelo de vista.
 */
export function mapMfaSetupHttpToOutcome(httpOk: boolean, body: unknown): MfaSetupOutcome {
    if (!httpOk) {
        return { success: false, error: mapUnknownToErrorMessage(body, 'Error al iniciar MFA') };
    }
    if (!isMfaSetupSuccess(body)) {
        return { success: false, error: mapUnknownToErrorMessage(body, 'Respuesta inválida') };
    }
    const d = body.data;
    return {
        success: true,
        setup: {
            secret: d.secret,
            qrCodeUri: d.qrCodeUri,
            manualEntryKey: d.manualEntryKey,
        },
    };
}

/**
 * Why: Extrae códigos de recuperación del envelope de confirmación.
 */
export function mapMfaConfirmHttpToOutcome(httpOk: boolean, body: unknown): MfaConfirmOutcome {
    if (!httpOk) {
        return { success: false, error: mapUnknownToErrorMessage(body, 'Error al confirmar MFA') };
    }

    if (!isRecord(body) || body.success !== true) {
        return { success: false, error: mapUnknownToErrorMessage(body, 'Respuesta inválida') };
    }

    const data = isRecord(body.data) ? body.data : body;
    const raw = (data as { recoveryCodes?: unknown }).recoveryCodes;
    const recoveryCodes = Array.isArray(raw) ? raw.filter((x): x is string => typeof x === 'string') : [];

    return { success: true, recoveryCodes };
}
