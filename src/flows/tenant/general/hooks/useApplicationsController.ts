'use client';

import { useCallback, useEffect, useState } from 'react';
import type { ApiErrorView } from '@common/domain/tenant.domain';
import type { ApplicationsOutcome, TenantApplication } from '@common/domain/application.domain';
import {
    createApplication,
    deleteApplication,
    listApplications,
    updateApplication,
} from '@common/api/clients/applications.http.client';
import {
    mapApplicationResponse,
    mapApplicationsResponse,
    mapDeleteApplicationResponse,
    parseOrigins,
} from '@common/api/mappers/application.mapper';

type ListState = { readonly kind: 'loading' } | ApplicationsOutcome;

type FormState =
    | { readonly kind: 'closed' }
    | { readonly kind: 'create' }
    | { readonly kind: 'edit'; readonly application: TenantApplication };

/**
 * Why: Aplicaciones del tenant (frontends o sistemas que usan su login): listar, crear, editar,
 * activar/desactivar y borrar. Los errores del backend se muestran con su código.
 */
export function useApplicationsController(tenantId: string) {
    const [list, setList] = useState<ListState>({ kind: 'loading' });
    const [form, setForm] = useState<FormState>({ kind: 'closed' });
    const [name, setName] = useState('');
    const [originsText, setOriginsText] = useState('');
    const [error, setError] = useState<ApiErrorView | null>(null);
    const [busy, setBusy] = useState(false);
    const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const load = useCallback(async () => {
        const http = await listApplications(tenantId);
        setList(mapApplicationsResponse(http.status, http.body));
    }, [tenantId]);

    useEffect(() => {
        void load();
    }, [load]);

    const openCreate = useCallback(() => {
        setError(null);
        setName('');
        setOriginsText('');
        setForm({ kind: 'create' });
    }, []);

    const openEdit = useCallback((application: TenantApplication) => {
        setError(null);
        setName(application.name);
        setOriginsText(application.allowedOrigins.join('\n'));
        setForm({ kind: 'edit', application });
    }, []);

    const closeForm = useCallback(() => {
        setError(null);
        setForm({ kind: 'closed' });
    }, []);

    const submit = useCallback(
        async (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            if (form.kind === 'closed') return;
            setError(null);
            setBusy(true);
            try {
                const draft = { name: name.trim(), allowedOrigins: parseOrigins(originsText) };
                const http = form.kind === 'create'
                    ? await createApplication(tenantId, draft)
                    : await updateApplication(tenantId, form.application.id, draft);
                const outcome = mapApplicationResponse(http.status, http.body, 'No se pudo guardar la aplicación');
                if (outcome.kind === 'error') {
                    setError(outcome.error);
                    return;
                }
                setForm({ kind: 'closed' });
                await load();
            } finally {
                setBusy(false);
            }
        },
        [form, name, originsText, tenantId, load]
    );

    const toggleActive = useCallback(
        async (application: TenantApplication) => {
            setError(null);
            setBusy(true);
            try {
                const http = await updateApplication(tenantId, application.id, { isActive: !application.isActive });
                const outcome = mapApplicationResponse(http.status, http.body, 'No se pudo cambiar el estado');
                if (outcome.kind === 'error') setError(outcome.error);
                await load();
            } finally {
                setBusy(false);
            }
        },
        [tenantId, load]
    );

    /** Primer click pide confirmación; el segundo borra. */
    const remove = useCallback(
        async (application: TenantApplication) => {
            if (pendingDeleteId !== application.id) {
                setPendingDeleteId(application.id);
                return;
            }
            setError(null);
            setBusy(true);
            try {
                const http = await deleteApplication(tenantId, application.id);
                const outcome = mapDeleteApplicationResponse(http.status, http.body);
                if (outcome.kind === 'error') setError(outcome.error);
                setPendingDeleteId(null);
                await load();
            } finally {
                setBusy(false);
            }
        },
        [pendingDeleteId, tenantId, load]
    );

    const copyId = useCallback(async (id: string) => {
        try {
            await navigator.clipboard.writeText(id);
            setCopiedId(id);
        } catch {
            setCopiedId(null);
        }
    }, []);

    return {
        list,
        form,
        name,
        setName,
        originsText,
        setOriginsText,
        error,
        busy,
        pendingDeleteId,
        cancelDelete: () => setPendingDeleteId(null),
        copiedId,
        openCreate,
        openEdit,
        closeForm,
        submit,
        toggleActive,
        remove,
        copyId,
        reload: load,
    };
}
