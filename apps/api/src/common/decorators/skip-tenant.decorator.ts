import { SetMetadata } from '@nestjs/common';
import { SKIP_TENANT_KEY } from '../constants/metadata-keys';

/** Rotas de plataforma (ex.: moderador) sem contexto de tenant obrigatório */
export const SkipTenant = () => SetMetadata(SKIP_TENANT_KEY, true);
