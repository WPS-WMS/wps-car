export type TenantUserRole = 'ADMIN' | 'MANAGER' | 'SELLER';

/** Gerente e vendedor devem ter vínculo explícito com matriz ou uma única filial. */
export function requiresBranchAssignment(role: string): boolean {
  return role === 'MANAGER' || role === 'SELLER';
}

export const BRANCH_ASSIGNMENT_HINT =
  'Gerente e vendedor ficam em um único local: matriz ou uma filial (nunca os dois, nem duas filiais).';
