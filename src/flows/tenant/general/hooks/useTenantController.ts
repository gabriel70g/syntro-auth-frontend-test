'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ApiErrorView, KitFormat, MyTenant } from '@common/domain/tenant.domain';
import { fetchIntegrationKit, getMyTenant, postCreateTenant } from '@common/api/clients/tenants.http.client';
import { refreshAccessToken } from '@common/api/clients/http.helpers';
import { mapCreateTenantResponse, mapMyTenantResponse } from '@common/api/mappers/tenant.mapper';
import { mapApiError } from '@common/api/mappers/api-error.mapper';
import { decodeJwtPayload } from '@common/lib/jwt';
import { readStoredAccessToken } from '@common/lib/storage/auth-session.storage';
import { writeActiveTenant } from '@common/lib/storage/tenant.storage';

type State =
    | { readonly kind: 'loading' }
    | { readonly kind: 'none' }
    | { readonly kind: 'owned'; readonly tenant: MyTenant }
    | { readonly kind: 'error'; readonly error: ApiErrorView };

const KIT_FILE_NAME: Record<KitFormat, (slug: string) => string> = {
    zip: (slug) => `syntroauth-kit-${slug}.zip`,
    md: () => 'INTEGRATION.md',
    llms: () => 'llms.txt',
};

/**
 * Why: Pantalla de la empresa: si el usuario no tiene tenant lo crea (POST /api/tenants + refresh
 * para obtener un token con el tenant nuevo); si tiene, descarga el kit de integración.
 */
export function useTenantController() {
    const router = useRouter();
    const [state, setState] = useState<State>({ kind: 'loading' });
    const [companyName, setCompanyName] = useState('');
    const [actionError, setActionError] = useState<ApiErrorView | null>(null);
    const [busy, setBusy] = useState(false);
    const [isGlobalAdmin, setIsGlobalAdmin] = useState(false);

    const load = useCallback(async () => {
        setState({ kind: 'loading' });
        const http = await getMyTenant();
        const outcome = mapMyTenantResponse(http.status, http.body);
        if (outcome.kind === 'owned') writeActiveTenant({ id: outcome.tenant.id, name: outcome.tenant.name });
        setState(outcome);
    }, []);

    useEffect(() => {
        const token = readStoredAccessToken();
        if (!token) {
            router.replace('/login');
            return;
        }
        // Solo decide qué links se muestran; la autorización la aplica el backend.
        setIsGlobalAdmin(decodeJwtPayload(token)?.role === 'admin');
        void load();
    }, [load, router]);

    const createTenant = useCallback(
        async (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            setActionError(null);
            const name = companyName.trim();
            if (!name) {
                setActionError({ code: 'VALIDATION_ERROR', message: 'Por favor completa todos los campos' });
                return;
            }
            setBusy(true);
            try {
                const http = await postCreateTenant(name);
                const outcome = mapCreateTenantResponse(http.status, http.body);
                if (outcome.kind === 'error') {
                    setActionError(outcome.error);
                    return;
                }
                writeActiveTenant({ id: outcome.tenantId, name: outcome.tenantName });
                // El token vigente todavía lleva el tenant anterior.
                if (outcome.requiresTokenRefresh && !(await refreshAccessToken())) {
                    setActionError({ code: 'REFRESH_REQUIRED', message: 'Volvé a iniciar sesión para usar la empresa nueva' });
                }
                await load();
            } finally {
                setBusy(false);
            }
        },
        [companyName, load]
    );

    const downloadKit = useCallback(async (tenant: MyTenant, format: KitFormat) => {
        setActionError(null);
        setBusy(true);
        try {
            const result = await fetchIntegrationKit(tenant.id, format);
            if (!result.blob) {
                setActionError(mapApiError(result.status, result.body, 'No se pudo descargar el kit'));
                return;
            }
            const url = URL.createObjectURL(result.blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = result.fileName ?? KIT_FILE_NAME[format](tenant.slug);
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);
        } catch {
            setActionError({ code: 'NETWORK_ERROR', message: 'No se pudo descargar el kit' });
        } finally {
            setBusy(false);
        }
    }, []);

    return { state, companyName, setCompanyName, actionError, busy, createTenant, downloadKit, reload: load, isGlobalAdmin };
}
