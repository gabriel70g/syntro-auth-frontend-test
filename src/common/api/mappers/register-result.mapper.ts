import { mapUnknownToErrorMessage } from '@common/api/mappers/error-message.mapper';
import { isRecord } from '@common/api/mappers/json-guards';

export type CreateUserHttpOutcome =
    | { readonly kind: 'created' }
    | { readonly kind: 'error'; readonly message: string };

/**
 * Why: POST /api/users devuelve envelope; mapear a resultado simple sin acoplar UI.
 */
export function mapCreateUserResponseToOutcome(httpOk: boolean, body: unknown): CreateUserHttpOutcome {
    if (httpOk) return { kind: 'created' };

    return {
        kind: 'error',
        message: mapUnknownToErrorMessage(body, 'Error al crear usuario'),
    };
}

/**
 * Why: Algunos errores vienen sin envelope estándar.
 */
export function mapLooseErrorBody(body: unknown, fallback: string): string {
    if (isRecord(body) && isRecord(body.error) && typeof body.error.message === 'string') {
        return body.error.message;
    }
    return mapUnknownToErrorMessage(body, fallback);
}
