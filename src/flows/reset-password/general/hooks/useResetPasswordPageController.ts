'use client';

import { useCallback, useState } from 'react';
import { postAuthResetPassword } from '@common/api/clients/auth.http.client';
import { mapResetPasswordResponse } from '@common/api/mappers/password-recovery.mapper';
import { encryptPassword } from '@common/lib/crypto';
import { validatePasswordStrict } from '@common/lib/password-validation';

/**
 * Why: Reset con token del query string; contraseña cifrada como en login.
 */
export function useResetPasswordPageController(resetToken: string) {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = useCallback(
        async (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            setError('');

            if (!resetToken) {
                setError('El enlace no es válido o ha expirado. Solicita uno nuevo desde “Olvidé mi contraseña”.');
                return;
            }

            if (password !== confirmPassword) {
                setError('Las contraseñas no coinciden');
                return;
            }

            const pwd = validatePasswordStrict(password);
            if (!pwd.valid) {
                setError(pwd.errors.join(', '));
                return;
            }

            setIsLoading(true);
            try {
                const enc = await encryptPassword(password);
                const http = await postAuthResetPassword({ token: resetToken, newPassword: enc });
                const outcome = mapResetPasswordResponse(http.ok, http.body);
                if (outcome.kind === 'error') {
                    setError(outcome.message);
                    return;
                }
                setSuccess(true);
            } catch {
                setError('Error inesperado. Intenta nuevamente.');
            } finally {
                setIsLoading(false);
            }
        },
        [resetToken, password, confirmPassword]
    );

    return {
        password,
        setPassword,
        confirmPassword,
        setConfirmPassword,
        isLoading,
        error,
        success,
        handleSubmit,
    };
}
