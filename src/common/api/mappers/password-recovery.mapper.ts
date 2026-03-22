import type { ApiPasswordRecoveryData, ApiSuccessResponse } from '@common/api/raw/envelope.types';
import { mapUnknownToErrorMessage } from '@common/api/mappers/error-message.mapper';
import { isRecord } from '@common/api/mappers/json-guards';

export type ForgotPasswordOutcome =
    | { kind: 'success'; message: string }
    | { kind: 'error'; message: string };

export type ResetPasswordOutcome =
    | { kind: 'success'; message: string }
    | { kind: 'error'; message: string };

function isApiSuccessEnvelope<T>(body: unknown): body is ApiSuccessResponse<T> {
    return isRecord(body) && body.success === true && 'data' in body;
}

function isPasswordRecoveryData(data: unknown): data is ApiPasswordRecoveryData {
    return isRecord(data) && typeof data.message === 'string';
}

/**
 * Why: Anti-enumeración: mensaje fijo en español para la UI aunque el API devuelva texto en inglés.
 */
export function mapForgotPasswordResponse(httpOk: boolean, body: unknown): ForgotPasswordOutcome {
    const genericOk =
        'Si el correo está registrado, te enviamos un enlace para restablecer la contraseña (revisa también spam).';

    if (httpOk && isApiSuccessEnvelope<ApiPasswordRecoveryData>(body) && isPasswordRecoveryData(body.data)) {
        return { kind: 'success', message: genericOk };
    }

    if (!httpOk) {
        return {
            kind: 'error',
            message: mapUnknownToErrorMessage(body, 'No se pudo enviar la solicitud. Intenta de nuevo.'),
        };
    }

    return { kind: 'success', message: genericOk };
}

/**
 * Why: Traduce éxito a copy de producto; errores vienen del envelope.
 */
export function mapResetPasswordResponse(httpOk: boolean, body: unknown): ResetPasswordOutcome {
    if (httpOk && isApiSuccessEnvelope<ApiPasswordRecoveryData>(body) && isPasswordRecoveryData(body.data)) {
        return {
            kind: 'success',
            message:
                'Contraseña actualizada. Te enviamos un correo de confirmación. Todas las sesiones anteriores se cerraron; ya puedes iniciar sesión.',
        };
    }

    return {
        kind: 'error',
        message: mapUnknownToErrorMessage(body, 'No se pudo restablecer la contraseña.'),
    };
}
