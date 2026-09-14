import type { ApiErrorView } from '@common/domain/tenant.domain';

/**
 * Why: View models de las aplicaciones de un tenant (ACL sobre /api/tenants/{id}/applications).
 */

export interface TenantApplication {
    readonly id: string;
    readonly name: string;
    readonly allowedOrigins: readonly string[];
    readonly isActive: boolean;
    readonly createdAt: string;
    readonly updatedAt: string;
}

export type ApplicationsOutcome =
    | { readonly kind: 'loaded'; readonly items: readonly TenantApplication[]; readonly max: number }
    | { readonly kind: 'error'; readonly error: ApiErrorView };

export type ApplicationOutcome =
    | { readonly kind: 'ok'; readonly application: TenantApplication }
    | { readonly kind: 'error'; readonly error: ApiErrorView };

export type DeleteApplicationOutcome =
    | { readonly kind: 'deleted' }
    | { readonly kind: 'error'; readonly error: ApiErrorView };

export interface ApplicationDraft {
    readonly name: string;
    readonly allowedOrigins: readonly string[];
}
