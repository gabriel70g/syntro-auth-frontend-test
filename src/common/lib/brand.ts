/**
 * Why: marca del producto (SyntroAuth) + sello de seguridad (syntropysoft), en un solo lugar.
 * El look es "Diamante" (negro + oro + hielo, ver globals.css @theme). SyntroAuth va al frente;
 * syntropysoft queda como respaldo de seguridad, casi imperceptible al fondo.
 */
export const BRAND = {
  name: 'SyntroAuth',
  tagline: 'Seguridad grado bancario para tu login',
  pitch:
    'Un solo login para todas tus aplicaciones. Si tenés varios sistemas, tus usuarios entran una vez y se mueven entre ellos como si fueran uno solo.',
  securedBy: 'syntropysoft',
} as const;
