/**
 * Why: Resultados de flujo MFA en UI, separados del envelope HTTP.
 */

export interface MfaSetupViewModel {
    readonly secret: string;
    readonly qrCodeUri: string;
    readonly manualEntryKey: string;
}

export interface MfaSetupOutcome {
    readonly success: boolean;
    readonly setup?: MfaSetupViewModel;
    readonly error?: string;
}

export interface MfaConfirmOutcome {
    readonly success: boolean;
    readonly recoveryCodes?: string[];
    readonly error?: string;
}
