import type {
    CreateTenantOutcome,
    MyTenantOutcome,
    RegisterTenantOutcome,
    TenantLookupOutcome,
} from '@common/domain/tenant.domain';
import { mapApiError } from '@common/api/mappers/api-error.mapper';
import { isRecord } from '@common/api/mappers/json-guards';

function dataOf(body: unknown): Record<string, unknown> | null {
    return isRecord(body) && body.success === true && isRecord(body.data) ? body.data : null;
}

const str = (v: unknown): v is string => typeof v === 'string' && v.length > 0;

export function mapMyTenantResponse(status: number, body: unknown): MyTenantOutcome {
    const data = dataOf(body);
    if (status === 200 && data && str(data.id) && str(data.name) && str(data.slug)) {
        return {
            kind: 'owned',
            tenant: {
                id: data.id,
                name: data.name,
                slug: data.slug,
                isActive: data.isActive === true,
                force2fa: data.force2fa === true,
                createdAt: typeof data.createdAt === 'string' ? data.createdAt : '',
            },
        };
    }
    const error = mapApiError(status, body, 'No se pudo leer el tenant');
    if (status === 404 && error.code === 'NO_OWNED_TENANT') return { kind: 'none' };
    return { kind: 'error', error };
}

export function mapRegisterTenantResponse(status: number, body: unknown): RegisterTenantOutcome {
    const data = dataOf(body);
    if (status === 201 && data && str(data.tenantId) && str(data.tenantName) && str(data.userEmail)) {
        return { kind: 'created', tenantId: data.tenantId, tenantName: data.tenantName, email: data.userEmail };
    }
    return { kind: 'error', error: mapApiError(status, body, 'No se pudo completar el registro') };
}

export function mapCreateTenantResponse(status: number, body: unknown): CreateTenantOutcome {
    const data = dataOf(body);
    if (status === 201 && data && str(data.id) && str(data.name)) {
        return { kind: 'created', tenantId: data.id, tenantName: data.name, requiresTokenRefresh: data.requiresTokenRefresh === true };
    }
    return { kind: 'error', error: mapApiError(status, body, 'No se pudo crear el tenant') };
}

export function mapTenantLookupResponse(status: number, body: unknown): TenantLookupOutcome {
    const data = dataOf(body);
    if (status === 200 && data && str(data.id) && str(data.name)) {
        return { kind: 'found', id: data.id, name: data.name };
    }
    return { kind: 'error', error: mapApiError(status, body, 'Empresa no encontrada') };
}
