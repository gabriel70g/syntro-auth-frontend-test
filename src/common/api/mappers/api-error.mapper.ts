import type { ApiErrorView } from '@common/domain/tenant.domain';
import { isRecord } from '@common/api/mappers/json-guards';

/**
 * Why: El backend manda { error: { code, message } }. La UI muestra el código tal cual; un 401/403
 * del middleware llega sin body y se nombra por su status.
 */
export function mapApiError(status: number, body: unknown, fallbackMessage: string): ApiErrorView {
    if (isRecord(body) && isRecord(body.error) && typeof body.error.code === 'string') {
        return {
            code: body.error.code,
            message: typeof body.error.message === 'string' ? body.error.message : fallbackMessage,
        };
    }
    return { code: status > 0 ? `HTTP_${status}` : 'NETWORK_ERROR', message: fallbackMessage };
}

export function formatApiError(error: ApiErrorView): string {
    return `${error.code}: ${error.message}`;
}
