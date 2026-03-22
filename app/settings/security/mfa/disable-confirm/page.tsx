'use client';

import { Suspense } from 'react';
import { MfaDisableConfirmScreen } from '@flows/mfa-account-settings/general/components/MfaDisableConfirmScreen';

export default function MfaDisableConfirmPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-slate-950 p-8 text-slate-400">Cargando…</div>}>
            <MfaDisableConfirmScreen />
        </Suspense>
    );
}
