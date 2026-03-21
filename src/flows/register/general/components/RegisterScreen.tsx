'use client';

import { useRegisterPageController } from '@flows/register/general/hooks/useRegisterPageController';
import { LoginArtBackground } from '@flows/login/general/components/LoginArtBackground';
import { RegisterSuccessPanel } from '@flows/register/general/components/RegisterSuccessPanel';
import { RegisterFormFields } from '@flows/register/general/components/RegisterFormFields';
import '@flows/login/general/login.css';

export function RegisterScreen() {
    const c = useRegisterPageController();

    return (
        <div className="login-container">
            <LoginArtBackground />
            {c.success ? (
                <RegisterSuccessPanel email={c.formData.email} />
            ) : (
                <RegisterFormFields
                    formData={c.formData}
                    setFormData={c.setFormData}
                    error={c.error}
                    isLoading={c.isLoading}
                    showPassword={c.showPassword}
                    setShowPassword={c.setShowPassword}
                    onSubmit={c.handleSubmit}
                />
            )}
        </div>
    );
}
