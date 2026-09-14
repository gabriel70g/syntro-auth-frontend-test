/**
 * Why: View models de tenants (ACL sobre el contrato de /api/tenants).
 */

export interface ApiErrorView {
    readonly code: string;
    readonly message: string;
}

export interface MyTenant {
    readonly id: string;
    readonly name: string;
    readonly slug: string;
    readonly isActive: boolean;
    readonly force2fa: boolean;
    readonly createdAt: string;
}

export type MyTenantOutcome =
    | { readonly kind: 'owned'; readonly tenant: MyTenant }
    | { readonly kind: 'none' }
    | { readonly kind: 'error'; readonly error: ApiErrorView };

export type RegisterTenantOutcome =
    | { readonly kind: 'created'; readonly tenantId: string; readonly tenantName: string; readonly email: string }
    | { readonly kind: 'error'; readonly error: ApiErrorView };

export type CreateTenantOutcome =
    | { readonly kind: 'created'; readonly tenantId: string; readonly tenantName: string; readonly requiresTokenRefresh: boolean }
    | { readonly kind: 'error'; readonly error: ApiErrorView };

export type TenantLookupOutcome =
    | { readonly kind: 'found'; readonly id: string; readonly name: string }
    | { readonly kind: 'error'; readonly error: ApiErrorView };

export type KitFormat = 'zip' | 'md' | 'llms';
