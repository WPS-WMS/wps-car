const tenantStatusLabels: Record<string, string> = {
  ACTIVE: 'Ativa',
  INACTIVE: 'Inativa',
  SUSPENDED: 'Suspensa',
  TRIAL: 'Trial',
};

const subscriptionPlanLabels: Record<string, string> = {
  STARTER: 'Starter',
  PROFESSIONAL: 'Professional',
  ENTERPRISE: 'Enterprise',
};

const tenantStatusStyles: Record<string, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  INACTIVE: 'bg-slate-100 text-slate-600',
  SUSPENDED: 'bg-red-100 text-red-700',
  TRIAL: 'bg-amber-100 text-amber-800',
};

export function tenantStatusLabel(status: string) {
  return tenantStatusLabels[status] ?? status;
}

export function subscriptionPlanLabel(plan: string) {
  return subscriptionPlanLabels[plan] ?? plan;
}

export function tenantStatusClass(status: string) {
  return tenantStatusStyles[status] ?? 'bg-slate-100 text-slate-600';
}
