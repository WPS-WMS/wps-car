/**
 * Perfis de ambiente (sem alterar código):
 *   ENV_PROFILE=local (padrão) → .env.local + .env
 *   ENV_PROFILE=qa           → .env.qa + .env
 */
export function resolveApiEnvFilePath(): string[] {
  const profile = (process.env.ENV_PROFILE ?? 'local').toLowerCase();
  if (profile === 'qa') {
    return ['.env.qa', '.env'];
  }
  return ['.env.local', '.env'];
}
