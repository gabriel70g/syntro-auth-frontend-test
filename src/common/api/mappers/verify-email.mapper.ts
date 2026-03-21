import { isRecord } from '@common/api/mappers/json-guards';

export interface VerifyEmailConfirmView {
    readonly accessToken: string | null;
    readonly twoFactorSecret: string | null;
    readonly twoFactorEnabled: boolean;
}

/**
 * Why: Normaliza respuesta de verify-email (con o sin envelope).
 */
export function mapVerifyEmailConfirmBody(body: unknown): VerifyEmailConfirmView {
    const root = unwrapEnvelopeData(body);

    const accessToken = readString(root, 'accessToken');
    const twoFactorSecret = readString(root, 'twoFactorSecret');
    const twoFactorEnabled = readBoolean(root, 'twoFactorEnabled');

    return {
        accessToken,
        twoFactorSecret,
        twoFactorEnabled,
    };
}

function unwrapEnvelopeData(body: unknown): unknown {
    if (isRecord(body) && body.success === true && 'data' in body) {
        return body.data;
    }
    return body;
}

function readString(root: unknown, key: string): string | null {
    if (!isRecord(root)) return null;
    const v = root[key];
    return typeof v === 'string' ? v : null;
}

function readBoolean(root: unknown, key: string): boolean {
    if (!isRecord(root)) return false;
    return root[key] === true;
}
