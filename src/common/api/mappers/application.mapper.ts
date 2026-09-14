import type {
    ApplicationOutcome,
    ApplicationsOutcome,
    DeleteApplicationOutcome,
    TenantApplication,
} from '@common/domain/application.domain';
import { mapApiError } from '@common/api/mappers/api-error.mapper';
import { isRecord } from '@common/api/mappers/json-guards';

function dataOf(body: unknown): unknown {
    return isRecord(body) && body.success === true ? body.data : null;
}

function toApplication(value: unknown): TenantApplication | null {
    if (!isRecord(value) || typeof value.id !== 'string' || typeof value.name !== 'string') return null;
    const origins = Array.isArray(value.allowedOrigins)
        ? value.allowedOrigins.filter((o): o is string => typeof o === 'string')
        : [];
    return {
        id: value.id,
        name: value.name,
        allowedOrigins: origins,
        isActive: value.isActive === true,
        createdAt: typeof value.createdAt === 'string' ? value.createdAt : '',
        updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : '',
    };
}

export function mapApplicationsResponse(status: number, body: unknown): ApplicationsOutcome {
    const data = dataOf(body);
    if (status === 200 && isRecord(data) && Array.isArray(data.items) && typeof data.maxApplications === 'number') {
        const items = data.items.map(toApplication);
        if (items.every((a): a is TenantApplication => a !== null)) {
            return { kind: 'loaded', items, max: data.maxApplications };
        }
    }
    return { kind: 'error', error: mapApiError(status, body, 'No se pudieron leer las aplicaciones') };
}

export function mapApplicationResponse(status: number, body: unknown, fallbackMessage: string): ApplicationOutcome {
    const application = (status === 200 || status === 201) ? toApplication(dataOf(body)) : null;
    if (application) return { kind: 'ok', application };
    return { kind: 'error', error: mapApiError(status, body, fallbackMessage) };
}

export function mapDeleteApplicationResponse(status: number, body: unknown): DeleteApplicationOutcome {
    if (status === 200 && isRecord(body) && body.success === true) return { kind: 'deleted' };
    return { kind: 'error', error: mapApiError(status, body, 'No se pudo borrar la aplicación') };
}

/** Un origen por línea (o separados por coma). La validación real la hace el backend. */
export function parseOrigins(text: string): string[] {
    return text
        .split(/[\n,]+/)
        .map((o) => o.trim())
        .filter((o) => o.length > 0);
}
