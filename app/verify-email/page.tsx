'use client';

import { Suspense } from 'react';
import { VerifyEmailScreen } from '@flows/verify-email/general/components/VerifyEmailScreen';

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-black text-white flex items-center justify-center">Cargando...</div>}>
            <VerifyEmailScreen />
        </Suspense>
    );
}
