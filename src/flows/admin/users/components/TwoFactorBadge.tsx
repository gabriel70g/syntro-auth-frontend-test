/** Why: indicador de 2FA, presentacional puro. */
export const TwoFactorBadge = ({ enabled }: { enabled: boolean }) =>
    enabled ? (
        <span className="sec-2fa sec-2fa--on">activo</span>
    ) : (
        <span className="sec-2fa sec-2fa--off">sin 2FA</span>
    );
