'use client';

import { useCallback, useState } from 'react';
import type { RegisterData } from '@common/domain/auth.domain';
import { postRegisterTenant } from '@common/api/clients/tenants.http.client';
import { mapRegisterTenantResponse } from '@common/api/mappers/tenant.mapper';
import { formatApiError } from '@common/api/mappers/api-error.mapper';
import { encryptPassword } from '@common/lib/crypto';
import { validatePassword } from '@common/lib/password-validation';
import { writeActiveTenant } from '@common/lib/storage/tenant.storage';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Why: Registro = empresa (tenant) + usuario dueño en una sola llamada. Sin login automático:
 * syntroAuth exige verificar el email antes del primer login.
 */
export function useRegisterPageController() {
    const [formData, setFormData] = useState<RegisterData>({ email: '', password: '', companyName: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [success, setSuccess] = useState(false);
    const [registeredTenantName, setRegisteredTenantName] = useState('');

    const handleSubmit = useCallback(
        async (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            setError('');

            if (!formData.email.trim() || !formData.password.trim() || !formData.companyName.trim()) {
                setError('Por favor completa todos los campos');
                return;
            }
            if (!emailRegex.test(formData.email)) {
                setError('Email inválido');
                return;
            }

            const pwd = validatePassword(formData.password);
            if (!pwd.valid) {
                setError(pwd.errors.join(', '));
                return;
            }

            setIsLoading(true);
            try {
                const encrypted = await encryptPassword(formData.password);
                const http = await postRegisterTenant({
                    tenantName: formData.companyName.trim(),
                    email: formData.email.trim(),
                    password: encrypted,
                });
                const outcome = mapRegisterTenantResponse(http.status, http.body);
                if (outcome.kind === 'error') {
                    setError(formatApiError(outcome.error));
                    return;
                }

                // El próximo login de este navegador va contra la empresa recién creada.
                writeActiveTenant({ id: outcome.tenantId, name: outcome.tenantName });
                setRegisteredTenantName(outcome.tenantName);
                setSuccess(true);
            } catch {
                setError('Error inesperado. Intenta nuevamente.');
            } finally {
                setIsLoading(false);
            }
        },
        [formData]
    );

    return {
        formData,
        setFormData,
        isLoading,
        error,
        showPassword,
        setShowPassword,
        success,
        registeredTenantName,
        handleSubmit,
    };
}
