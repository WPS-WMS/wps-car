import type { Request } from 'express';

export type AuditRequestMeta = {
  ipAddress?: string;
  userAgent?: string;
};

export function auditMetaFromRequest(req?: Request): AuditRequestMeta {
  if (!req) return {};

  const forwarded = req.headers['x-forwarded-for'];
  const ipFromProxy =
    typeof forwarded === 'string'
      ? forwarded.split(',')[0]?.trim()
      : Array.isArray(forwarded)
        ? forwarded[0]
        : undefined;

  return {
    ipAddress: ipFromProxy || req.ip || undefined,
    userAgent: req.headers['user-agent'],
  };
}
