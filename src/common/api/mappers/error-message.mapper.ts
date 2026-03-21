import { isRecord } from '@common/api/mappers/json-guards';

/**
 * Why: Un solo lugar para extraer mensaje de error del envelope o cuerpos sueltos.
 */
export function mapUnknownToErrorMessage(body: unknown, fallback: string): string {
    if (body === null || body === undefined) return fallback;
    if (!isRecord(body)) return fallback;

    if (body.success === false && isRecord(body.error) && typeof body.error.message === 'string') {
        return body.error.message;
    }

    if (typeof body.message === 'string') return body.message;

    return fallback;
}
