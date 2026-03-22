import type { MfaConfirmOutcome, MfaSetupOutcome, MfaSetupViewModel } from '@common/domain/mfa.domain';
import type { ApiSuccessResponse } from '@common/api/raw/envelope.types';
import { mapUnknownToErrorMessage } from '@common/api/mappers/error-message.mapper';
import { isRecord } from '@common/api/mappers/json-guards';

function isNonEmptyString(v: unknown): v is string {
    return typeof v === 'string' && v.trim().length > 0;
}

/**
 * Why: ACL defensivo — el API usa camelCase; tolerar PascalCase por versiones o proxies.
 */
function readField(obj: Record<string, unknown>, camel: string, pascal: string): string | null {
    const a = obj[camel];
    const b = obj[pascal];
    if (isNonEmptyString(a)) return a.trim();
    if (isNonEmptyString(b)) return b.trim();
    return null;
}

/**
 * Why: Validación pura del cuerpo `data` del setup MFA; sin asumir forma correcta.
 */
export function parseMfaSetupPayload(data: unknown): MfaSetupViewModel | null {
    if (!isRecord(data)) return null;

    const secret = readField(data, 'secret', 'Secret');
    const qrCodeUri = readField(data, 'qrCodeUri', 'QrCodeUri');
    const manualEntryKey = readField(data, 'manualEntryKey', 'ManualEntryKey');

    if (!secret || !qrCodeUri || !manualEntryKey) return null;

    return { secret, qrCodeUri, manualEntryKey };
}

function isMfaSetupSuccessEnvelope(body: unknown): body is ApiSuccessResponse<Record<string, unknown>> {
    return isRecord(body) && body.success === true && isRecord(body.data);
}

/**
 * Why: Respuesta de setup MFA → modelo de vista.
 */
export function mapMfaSetupHttpToOutcome(httpOk: boolean, body: unknown): MfaSetupOutcome {
    if (!httpOk) {
        return { success: false, error: mapUnknownToErrorMessage(body, 'Error al iniciar MFA') };
    }

    if (!isMfaSetupSuccessEnvelope(body)) {
        return { success: false, error: mapUnknownToErrorMessage(body, 'Respuesta inválida') };
    }

    const setup = parseMfaSetupPayload(body.data);
    if (!setup) {
        return {
            success: false,
            error: 'El servidor no devolvió datos completos para 2FA (secret / QR / clave manual).',
        };
    }

    return { success: true, setup };
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
