import { NextResponse } from 'next/server';

/**
 * Why: el BFF habla el mismo envelope que el backend (`{ success, statusCode, data | error }`), así los mappers
 * del cliente no cambian. Y ningún token sale hacia el navegador, aunque un endpoint nuevo lo devuelva.
 */

const TOKEN_FIELDS = ['accessToken', 'refreshToken', 'tempToken'] as const;

export function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function bffError(status: number, code: string, message: string): NextResponse {
    return NextResponse.json(
        { success: false, statusCode: status, error: { code, message } },
        { status, headers: { 'Cache-Control': 'no-store' } },
    );
}

export function bffOk(data: unknown): NextResponse {
    return NextResponse.json({ success: true, statusCode: 200, data }, { headers: { 'Cache-Control': 'no-store' } });
}

export interface CapturedTokens {
    readonly access: string | null;
    readonly refresh: string | null;
    readonly tempToken: string | null;
}

/** Saca los tokens de `data` y los devuelve aparte. El body resultante es el que ve el navegador. */
export function stripTokens(body: unknown): { body: unknown; tokens: CapturedTokens } {
    if (!isRecord(body) || !isRecord(body.data)) {
        return { body, tokens: { access: null, refresh: null, tempToken: null } };
    }
    const data: Record<string, unknown> = { ...body.data };
    const read = (key: string) => (typeof data[key] === 'string' && data[key] !== '' ? (data[key] as string) : null);
    const tokens = { access: read('accessToken'), refresh: read('refreshToken'), tempToken: read('tempToken') };
    for (const key of TOKEN_FIELDS) delete data[key];
    return { body: { ...body, data }, tokens };
}
