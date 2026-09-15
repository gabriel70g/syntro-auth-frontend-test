import { isRecord } from '@common/api/mappers/json-guards';

export interface VerifyEmailConfirmView {
    /** El backend auto-loguea al confirmar; el BFF guardó la sesión en cookies. */
    readonly authenticated: boolean;
    readonly role: string | undefined;
    readonly twoFactorSecret: string | null;
    readonly twoFactorEnabled: boolean;
}

/**
 * Why: Normaliza respuesta de verify-email (con o sin envelope).
 */
export function mapVerifyEmailConfirmBody(body: unknown): VerifyEmailConfirmView {
    const root = unwrapEnvelopeData(body);

    return {
        authenticated: readBoolean(root, 'authenticated'),
        role: readString(root, 'role') ?? undefined,
        twoFactorSecret: readString(root, 'twoFactorSecret'),
        twoFactorEnabled: readBoolean(root, 'twoFactorEnabled'),
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
