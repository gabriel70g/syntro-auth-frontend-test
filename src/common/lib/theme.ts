/**
 * Why: el layout (servidor) y el selector (cliente) comparten el nombre de la cookie y el parseo. Vive en un módulo
 * sin 'use client': una función exportada desde un módulo cliente no se puede llamar en el servidor (React #441).
 */

export type ThemeChoice = 'system' | 'light' | 'dark';

export const THEME_COOKIE = 'sa_theme';

export function parseThemeChoice(value: string | undefined): ThemeChoice {
    return value === 'light' || value === 'dark' ? value : 'system';
}
