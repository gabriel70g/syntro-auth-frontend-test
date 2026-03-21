'use client';

import { useCallback, useState } from 'react';
import type { RegisterData } from '@common/domain/auth.domain';
import { postCreateUser } from '@common/api/clients/users.http.client';
import { postAuthLogin } from '@common/api/clients/auth.http.client';
import { mapCreateUserResponseToOutcome } from '@common/api/mappers/register-result.mapper';
import { mapLoginResponseBodyToResult } from '@common/api/mappers/login-result.mapper';
import { encryptPassword } from '@common/lib/crypto';
import { validatePassword } from '@common/lib/password-validation';
import { writeAuthSessionToStorage } from '@common/lib/storage/auth-session.storage';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Why: Registro → login automático; mapeo fuera del JSX.
 */
export function useRegisterPageController() {
    const [formData, setFormData] = useState<RegisterData>({ email: '', password: '', name: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = useCallback(
        async (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            setError('');

            if (!formData.email.trim() || !formData.password.trim() || !formData.name.trim()) {
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
                const enc = await encryptPassword(formData.password);
                const created = await postCreateUser({ email: formData.email, password: enc });
                const createOutcome = mapCreateUserResponseToOutcome(created.ok, created.body);
                if (createOutcome.kind === 'error') {
                    setError(createOutcome.message);
                    return;
                }

                const enc2 = await encryptPassword(formData.password);
                const loginHttp = await postAuthLogin({ email: formData.email, password: enc2 });
                const loginResult = mapLoginResponseBodyToResult(loginHttp.ok, loginHttp.body);

                if (!loginResult.success || !loginResult.session) {
                    setError(loginResult.error || 'Error al iniciar sesión tras registro');
                    return;
                }

                writeAuthSessionToStorage(loginResult.session);
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
        handleSubmit,
    };
}
