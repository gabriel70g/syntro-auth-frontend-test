'use client';

import { useEffect, useState } from 'react';
import { stepUpChallenge, stepUpVerify } from '@common/api/clients/admin-users.http.client';
import type { AdminAction } from '@flows/admin/users/hooks/useAdminUsersController';

type Phase = 'challenge' | 'ready' | 'working' | 'error';

/**
 * Why: puerta de 2FA para acciones sensibles. Pide el challenge al abrir, exige el código TOTP,
 * verifica (eleva a acr=high) y RECIÉN AHÍ ejecuta la acción. Sin 2FA no se toca nada.
 */
export function StepUpModal({
    action,
    onClose,
    onDone,
}: {
    action: AdminAction;
    onClose: () => void;
    onDone: () => void;
}) {
    const [challengeToken, setChallengeToken] = useState<string | null>(null);
    const [code, setCode] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [phase, setPhase] = useState<Phase>('challenge');

    useEffect(() => {
        let alive = true;
        void (async () => {
            const r = await stepUpChallenge(action.operationHint);
            if (!alive) return;
            if (r.ok && r.challengeToken) {
                setChallengeToken(r.challengeToken);
                setPhase('ready');
            } else {
                setError(r.error ?? 'No se pudo iniciar el paso de 2FA.');
                setPhase('error');
            }
        })();
        return () => {
            alive = false;
        };
    }, [action.operationHint]);

    const submit = async () => {
        setError(null);
        if (code.trim().length < 6) {
            setError('Ingresá el código de 6 dígitos.');
            return;
        }
        if (!challengeToken) return;
        setPhase('working');
        const v = await stepUpVerify(challengeToken, code.trim());
        if (!v.ok) {
            setError(v.error ?? 'Código inválido o vencido.');
            setPhase('ready');
            return;
        }
        const res = await action.run();
        if (!res.ok) {
            setError('El 2FA fue correcto, pero la acción falló. Reintentá.');
            setPhase('ready');
            return;
        }
        onDone();
    };

    return (
        <div className="stepup-overlay" onClick={onClose}>
            <div className="stepup-modal" onClick={(e) => e.stopPropagation()}>
                <p className="stepup-eyebrow">Verificación 2FA requerida</p>
                <h2 className="stepup-title">{action.title}</h2>
                <p className="stepup-sub">
                    Esta operación toca el sistema nervioso de la seguridad. Ingresá el código de tu
                    app de autenticación para confirmar.
                </p>
                <input
                    className="stepup-code"
                    inputMode="numeric"
                    maxLength={6}
                    value={code}
                    onChange={(e) => {
                        setCode(e.target.value.replace(/\D/g, ''));
                        if (error) setError(null);
                    }}
                    placeholder="000000"
                    disabled={phase === 'challenge' || phase === 'working'}
                    autoFocus
                />
                {error && <p className="stepup-error">{error}</p>}
                <div className="stepup-actions">
                    <button className="stepup-cancel" onClick={onClose} disabled={phase === 'working'}>
                        Cancelar
                    </button>
                    <button
                        className={`stepup-confirm${action.danger ? ' is-danger' : ''}`}
                        onClick={submit}
                        disabled={phase === 'challenge' || phase === 'working'}
                    >
                        {phase === 'working' ? 'Verificando…' : action.confirmLabel}
                    </button>
                </div>
                <p className="stepup-hint">Elevación efímera (acr=high, ~5 min) · PEN-1 step-up</p>
            </div>
        </div>
    );
}
