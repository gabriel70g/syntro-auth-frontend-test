/**
 * Why: Plain .txt body; user can save offline (password manager / encrypted storage) without uploading to any server.
 */
export function buildRecoveryCodesFileBody(codes: string[], preambleLines: string[]): string {
    const body = [...preambleLines, '', '---', '', ...codes, ''].join('\n');
    return body;
}

/**
 * Why: Fixed header with security notice and UTC timestamp (English for exported artifact).
 */
export function defaultRecoveryCodesPreamble(): string[] {
    const iso = new Date().toISOString();
    return [
        'SyntroAuth — Two-factor authentication (2FA) recovery codes',
        `Generated (UTC): ${iso}`,
        '',
        'Store this file in a safe place (password manager, encrypted folder, physical safe).',
        'Each code is typically single-use; do not share it with anyone.',
    ];
}

/**
 * Why: Browser download only; content never sent to a backend.
 */
export function downloadTextFile(filename: string, content: string): void {
    if (typeof window === 'undefined') return;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.rel = 'noopener';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
}

/**
 * Why: One click after MFA enrollment; filename includes date for archiving.
 */
export function downloadRecoveryCodesTxt(codes: string[]): void {
    if (codes.length === 0) return;
    const content = buildRecoveryCodesFileBody(codes, defaultRecoveryCodesPreamble());
    const day = new Date().toISOString().slice(0, 10);
    downloadTextFile(`syntroauth-recovery-codes-${day}.txt`, content);
}
