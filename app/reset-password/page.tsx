'use client';

import { Suspense } from 'react';
import { ResetPasswordScreen } from '@flows/reset-password/general/components/ResetPasswordScreen';
import { LoginArtBackground } from '@flows/login/general/components/LoginArtBackground';
import '@flows/login/general/login.css';

/**
 * Why: useSearchParams requiere Suspense en el App Router.
 */
function ResetPasswordFallback() {
    return (
        <div className="login-container">
            <LoginArtBackground />
            <div className="login-card">
                <p className="login-subtitle">Cargando…</p>
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<ResetPasswordFallback />}>
            <ResetPasswordScreen />
        </Suspense>
    );
}
