'use client';

import { useMemo, useState } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronDown, Loader2, UserPlus, Pencil, Ban } from 'lucide-react';
import { toast } from 'sonner';
import { api, ApiError } from '@/lib/api';
import { commissionTypeOptions, isPercentageCommission } from '@/lib/commission-labels';
import { hasPermission } from '@/lib/permissions';
import { useAuth } from '@/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { BranchAssignmentField } from '@/components/users/branch-assignment-field';
import { FormField, FormNativeSelect, FormTextarea } from '@/components/vehicles/form-field';
import { branchIdToPayload, userBranchLabel } from '@/hooks/use-tenant-branch-options';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { TenantUser } from '@/types/api';

const roles = [
  { value: 'ADMIN', label: 'Administrador' },
  { value: 'MANAGER', label: 'Gerente' },
  { value: 'SELLER', label: 'Vendedor' },
] as const;

const schema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
  role: z.enum(['ADMIN', 'MANAGER', 'SELLER']),
  branchId: z.string(),
  phone: z.string().optional(),
  address: z.string().optional(),
  commissionType: z.string().optional(),
  commissionValue: z.number().optional(),
});

type Values = z.infer<typeof schema>;

const editSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('E-mail inválido'),
  role: z.enum(['ADMIN', 'MANAGER', 'SELLER']),
  branchId: z.string(),
  phone: z.string().optional(),
  address: z.string().optional(),
  commissionType: z.string().optional(),
  commissionValue: z.number().optional(),
});

type EditValues = z.infer<typeof editSchema>;

const deactivateSchema = z.object({
  reason: z.string().min(1, 'Motivo é obrigatório').max(500),
});

type DeactivateValues = z.infer<typeof deactivateSchema>;

function empty(): Values {
  return {
    name: '',
    email: '',
    password: '',
    role: 'SELLER',
    branchId: '',
    phone: '',
    address: '',
    commissionType: 'SALE_PERCENTAGE',
    commissionValue: 2,
  };
}

export function UserCreateCard({
  collapsible = true,
  defaultExpanded = false,
  title = 'Usuários',
  descriptionCollapsed = 'Clique para ver a lista e criar novos usuários',
  descriptionExpanded = 'Gerencie os usuários da revenda',
  hideHeader = false,
}: {
  collapsible?: boolean;
  defaultExpanded?: boolean;
  title?: string;
  descriptionCollapsed?: string;
  descriptionExpanded?: string;
  hideHeader?: boolean;
} = {}) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const canCreate = hasPermission(user, 'users:create');
  const canReadUsers = hasPermission(user, 'users:read');

  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<TenantUser | null>(null);
  const [expanded, setExpanded] = useState(defaultExpanded || !collapsible);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: empty(),
  });

  const role = watch('role');
  const commissionType = watch('commissionType') ?? '';

  const showCommission = role === 'SELLER';
  const requiresValue =
    showCommission && commissionType && commissionType !== 'CUSTOM_PER_VEHICLE';

  const commissionValueLabel = useMemo(() => {
    if (!commissionType) return 'Valor';
    if (commissionType === 'CUSTOM_PER_VEHICLE') return 'Sem valor';
    return isPercentageCommission(commissionType) ? 'Percentual (%)' : 'Valor (R$)';
  }, [commissionType]);

  const createMutation = useMutation({
    mutationFn: async (values: Values) => {
      const payload: Record<string, unknown> = {
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password,
        role: values.role,
        branchId: branchIdToPayload(values.branchId),
        phone: values.phone?.trim() || undefined,
        address: values.address?.trim() || undefined,
      };

      if (values.role === 'SELLER' && values.commissionType) {
        payload.commissionType = values.commissionType;
        if (values.commissionType !== 'CUSTOM_PER_VEHICLE') {
          payload.commissionValue = values.commissionValue ?? 0;
        }
      }

      return api.createUser(payload);
    },
    onSuccess: () => {
      toast.success('Usuário criado');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setOpen(false);
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : 'Erro ao criar usuário');
    },
  });

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    watch: watchEdit,
    setValue: setValueEdit,
    reset: resetEdit,
    formState: { errors: editErrors, isSubmitting: isSubmittingEdit },
  } = useForm<EditValues>({
    resolver: zodResolver(editSchema),
  });

  const {
    register: registerDeactivate,
    handleSubmit: handleSubmitDeactivate,
    reset: resetDeactivate,
    formState: { errors: deactErrors, isSubmitting: isSubmittingDeactivate },
  } = useForm<DeactivateValues>({
    resolver: zodResolver(deactivateSchema),
    defaultValues: { reason: '' },
  });

  const editRole = watchEdit('role');
  const editCommissionType = watchEdit('commissionType') ?? '';
  const showEditCommission = editRole === 'SELLER';
  const editRequiresValue =
    showEditCommission && editCommissionType && editCommissionType !== 'CUSTOM_PER_VEHICLE';

  const editCommissionValueLabel = useMemo(() => {
    if (!editCommissionType) return 'Valor';
    if (editCommissionType === 'CUSTOM_PER_VEHICLE') return 'Sem valor';
    return isPercentageCommission(editCommissionType) ? 'Percentual (%)' : 'Valor (R$)';
  }, [editCommissionType]);

  const updateMutation = useMutation({
    mutationFn: async (values: EditValues) => {
      if (!selectedUser) return;
      const payload: Record<string, unknown> = {
        name: values.name.trim(),
        email: values.email.trim(),
        role: values.role,
        branchId: branchIdToPayload(values.branchId),
        phone: values.phone?.trim() || undefined,
        address: values.address?.trim() || undefined,
      };
      if (values.role === 'SELLER' && values.commissionType) {
        payload.commissionType = values.commissionType;
        if (values.commissionType !== 'CUSTOM_PER_VEHICLE') {
          payload.commissionValue = values.commissionValue ?? 0;
        }
      }
      return api.updateUser(selectedUser.id, payload);
    },
    onSuccess: () => {
      toast.success('Usuário atualizado');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setEditOpen(false);
      setSelectedUser(null);
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : 'Erro ao atualizar usuário');
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: async (values: DeactivateValues) => {
      if (!selectedUser) return;
      return api.deactivateUser(selectedUser.id, values.reason);
    },
    onSuccess: () => {
      toast.success('Usuário inativado');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setDeactivateOpen(false);
      setSelectedUser(null);
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : 'Erro ao inativar usuário');
    },
  });

  const activateMutation = useMutation({
    mutationFn: async (u: TenantUser) => api.activateUser(u.id),
    onSuccess: () => {
      toast.success('Usuário ativado');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : 'Erro ao ativar usuário');
    },
  });

  const usersQuery = useQuery({
    queryKey: ['users', { page: 1 }],
    queryFn: () => api.getUsers({ page: 1, limit: 100 }),
    enabled: (expanded || !collapsible) && canReadUsers,
  });

  const users: TenantUser[] = usersQuery.data?.data ?? [];

  if (!canCreate && !canReadUsers) return null;

  function roleLabel(role: string) {
    switch (role) {
      case 'ADMIN':
        return 'Administrador';
      case 'MANAGER':
        return 'Gerente';
      case 'SELLER':
        return 'Vendedor';
      default:
        return role;
    }
  }

  function openEdit(u: TenantUser) {
    setSelectedUser(u);
    resetEdit({
      name: u.name ?? '',
      email: u.email ?? '',
      role: (u.role as any) ?? 'SELLER',
      branchId: u.branchId ?? '',
      phone: u.phone ?? '',
      address: u.address ?? '',
      commissionType: 'SALE_PERCENTAGE',
      commissionValue: 0,
    });
    setEditOpen(true);
  }

  function openDeactivate(u: TenantUser) {
    setSelectedUser(u);
    resetDeactivate({ reason: '' });
    setDeactivateOpen(true);
  }

  return (
    <Card>
      {hideHeader ? null : collapsible ? (
        <button
          type="button"
          className="w-full text-left"
          onClick={() => setExpanded((v) => !v)}
        >
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div className="space-y-1">
              <CardTitle>{title}</CardTitle>
              <CardDescription>
                {expanded ? descriptionExpanded : descriptionCollapsed}
              </CardDescription>
            </div>
            <ChevronDown
              className={`mt-1 h-5 w-5 text-muted-foreground transition-transform ${
                expanded ? 'rotate-180' : ''
              }`}
            />
          </CardHeader>
        </button>
      ) : (
        <CardHeader className="space-y-1">
          <CardTitle>{title}</CardTitle>
          <CardDescription>{descriptionExpanded}</CardDescription>
        </CardHeader>
      )}

      {expanded || !collapsible ? (
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-foreground">Lista de usuários</p>
              <Badge variant="secondary">
                {usersQuery.isLoading ? '…' : `${users.length}`}
              </Badge>
            </div>
            {canCreate ? (
              <Dialog
                modal={false}
                open={open}
                onOpenChange={(v) => {
                  setOpen(v);
                  if (v) reset(empty());
                }}
              >
                <DialogTrigger asChild>
                  <Button type="button" size="sm" className="h-9 gap-2 px-3">
                    <UserPlus className="h-4 w-4" />
                    Novo usuário
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[90vh] max-w-lg overflow-visible">
                  <DialogHeader>
                    <DialogTitle>Novo usuário</DialogTitle>
                    <DialogDescription>
                      Nome e e-mail são obrigatórios. A senha é definida uma vez.
                    </DialogDescription>
                  </DialogHeader>

                  <form
                    noValidate
                    onSubmit={handleSubmit((v) => createMutation.mutateAsync(v))}
                    className="max-h-[calc(90vh-8rem)] space-y-4 overflow-y-auto pr-1"
                  >
                    <FormField label="Nome" required error={errors.name?.message}>
                      <Input {...register('name')} />
                    </FormField>

                    <FormField label="E-mail" required error={errors.email?.message}>
                      <Input type="email" {...register('email')} />
                    </FormField>

                    <FormField label="Senha" required error={errors.password?.message}>
                      <Input type="password" {...register('password')} />
                    </FormField>

                    <FormNativeSelect
                      label="Tipo de usuário"
                      required
                      value={role}
                      onChange={(v) =>
                        setValue('role', v as Values['role'], { shouldValidate: true })
                      }
                      options={roles as unknown as { value: string; label: string }[]}
                      error={errors.role?.message}
                    />

                    <BranchAssignmentField
                      value={watch('branchId') ?? ''}
                      onChange={(v) =>
                        setValue('branchId', v, { shouldValidate: true, shouldDirty: true })
                      }
                      error={errors.branchId?.message}
                    />

                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField label="Telefone" error={errors.phone?.message}>
                        <Input {...register('phone')} placeholder="Opcional" />
                      </FormField>
                      <FormField label="Endereço" error={errors.address?.message}>
                        <Input {...register('address')} placeholder="Opcional" />
                      </FormField>
                    </div>

                    {showCommission ? (
                      <div className="rounded-lg border border-border bg-muted/20 p-3">
                        <h3 className="text-sm font-semibold text-foreground">
                          Comissão do vendedor
                        </h3>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Essa é a regra padrão do vendedor. Se houver comissão personalizada por
                          veículo, ela sempre tem prioridade.
                        </p>

                        <div className="mt-3 grid gap-4 sm:grid-cols-2">
                          <FormNativeSelect
                            label="Tipo de comissão"
                            required
                            value={commissionType}
                            onChange={(v) =>
                              setValue('commissionType', v, {
                                shouldValidate: true,
                                shouldDirty: true,
                              })
                            }
                            options={
                              commissionTypeOptions as unknown as {
                                value: string;
                                label: string;
                              }[]
                            }
                            error={errors.commissionType?.message}
                          />

                          {requiresValue ? (
                            <FormField
                              label={commissionValueLabel}
                              required
                              error={errors.commissionValue?.message}
                            >
                              <Input
                                type="number"
                                step="0.0001"
                                value={String(watch('commissionValue') ?? '')}
                                onChange={(e) =>
                                  setValue(
                                    'commissionValue',
                                    e.target.value === '' ? undefined : Number(e.target.value),
                                    { shouldValidate: true, shouldDirty: true },
                                  )
                                }
                              />
                            </FormField>
                          ) : (
                            <FormField label={commissionValueLabel}>
                              <Input disabled value="—" />
                            </FormField>
                          )}
                        </div>
                      </div>
                    ) : null}

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isSubmitting || createMutation.isPending}
                    >
                      {isSubmitting || createMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Criando…
                        </>
                      ) : (
                        'Criar usuário'
                      )}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            ) : null}
          </div>

          {!canReadUsers ? (
            <p className="text-sm text-muted-foreground">
              Você não tem permissão para listar usuários.
            </p>
          ) : usersQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando…</p>
          ) : (
            <div className="overflow-hidden rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead>Nome</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Perfil</TableHead>
                    <TableHead>Loja</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-40" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id} className="bg-white hover:bg-muted/20">
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell className="text-sm">{u.email}</TableCell>
                      <TableCell>
                        <Badge variant={u.role === 'ADMIN' ? 'success' : 'secondary'}>
                          {roleLabel(u.role)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {userBranchLabel(u)}
                      </TableCell>
                      <TableCell className="text-sm">
                        <Badge variant={u.active === false ? 'destructive' : 'secondary'}>
                          {u.active === false ? 'Inativo' : 'Ativo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            size="icon-sm"
                            variant="ghost"
                            onClick={() => openEdit(u)}
                            aria-label="Editar usuário"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {u.active === false ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={activateMutation.isPending}
                              onClick={() => activateMutation.mutate(u)}
                            >
                              Ativar
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              size="icon-sm"
                              variant="ghost"
                              className="text-destructive hover:text-destructive"
                              onClick={() => openDeactivate(u)}
                              aria-label="Inativar usuário"
                            >
                              <Ban className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!users.length ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                        Nenhum usuário encontrado
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      ) : null}

      <Dialog
        modal={false}
        open={editOpen}
        onOpenChange={(v) => {
          setEditOpen(v);
          if (!v) setSelectedUser(null);
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-lg overflow-visible">
          <DialogHeader>
            <DialogTitle>Editar usuário</DialogTitle>
            <DialogDescription>
              Atualize dados do usuário e, se for vendedor, a comissão padrão.
            </DialogDescription>
          </DialogHeader>

          <form
            noValidate
            onSubmit={handleSubmitEdit((v) => updateMutation.mutateAsync(v))}
            className="max-h-[calc(90vh-8rem)] space-y-4 overflow-y-auto pr-1"
          >
            <FormField label="Nome" required error={editErrors.name?.message}>
              <Input {...registerEdit('name')} />
            </FormField>

            <FormField label="E-mail" required error={editErrors.email?.message}>
              <Input type="email" {...registerEdit('email')} />
            </FormField>

            <FormNativeSelect
              label="Tipo de usuário"
              required
              value={editRole ?? 'SELLER'}
              onChange={(v) => setValueEdit('role', v as any, { shouldValidate: true })}
              options={roles as unknown as { value: string; label: string }[]}
              error={editErrors.role?.message}
            />

            <BranchAssignmentField
              value={watchEdit('branchId') ?? ''}
              onChange={(v) =>
                setValueEdit('branchId', v, { shouldValidate: true, shouldDirty: true })
              }
              error={editErrors.branchId?.message}
              currentBranch={
                selectedUser?.branchId
                  ? {
                      id: selectedUser.branchId,
                      name: selectedUser.branchName ?? 'Filial',
                    }
                  : null
              }
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Telefone" error={editErrors.phone?.message}>
                <Input {...registerEdit('phone')} placeholder="Opcional" />
              </FormField>
              <FormField label="Endereço" error={editErrors.address?.message}>
                <Input {...registerEdit('address')} placeholder="Opcional" />
              </FormField>
            </div>

            {showEditCommission ? (
              <div className="rounded-lg border border-border bg-muted/20 p-3">
                <h3 className="text-sm font-semibold text-foreground">Comissão do vendedor</h3>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  <FormNativeSelect
                    label="Tipo de comissão"
                    required
                    value={editCommissionType}
                    onChange={(v) =>
                      setValueEdit('commissionType', v, {
                        shouldValidate: true,
                        shouldDirty: true,
                      })
                    }
                    options={commissionTypeOptions as unknown as { value: string; label: string }[]}
                    error={editErrors.commissionType?.message}
                  />

                  {editRequiresValue ? (
                    <FormField
                      label={editCommissionValueLabel}
                      required
                      error={editErrors.commissionValue?.message}
                    >
                      <Input
                        type="number"
                        step="0.0001"
                        value={String(watchEdit('commissionValue') ?? '')}
                        onChange={(e) =>
                          setValueEdit(
                            'commissionValue',
                            e.target.value === '' ? undefined : Number(e.target.value),
                            { shouldValidate: true, shouldDirty: true },
                          )
                        }
                      />
                    </FormField>
                  ) : (
                    <FormField label={editCommissionValueLabel}>
                      <Input disabled value="—" />
                    </FormField>
                  )}
                </div>
              </div>
            ) : null}

            <Button type="submit" className="w-full" disabled={isSubmittingEdit || updateMutation.isPending}>
              {isSubmittingEdit || updateMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando…
                </>
              ) : (
                'Salvar'
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        modal={false}
        open={deactivateOpen}
        onOpenChange={(v) => {
          setDeactivateOpen(v);
          if (!v) setSelectedUser(null);
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Inativar usuário</DialogTitle>
            <DialogDescription>
              Informe o motivo. O usuário será desconectado e não conseguirá mais acessar.
            </DialogDescription>
          </DialogHeader>

          <form noValidate onSubmit={handleSubmitDeactivate((v) => deactivateMutation.mutateAsync(v))} className="space-y-4">
            <FormTextarea
              label="Motivo"
              required
              rows={3}
              error={deactErrors.reason?.message}
              placeholder="Descreva o motivo da inativação…"
              {...registerDeactivate('reason')}
            />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDeactivateOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" variant="destructive" disabled={isSubmittingDeactivate || deactivateMutation.isPending}>
                {isSubmittingDeactivate || deactivateMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Inativando…
                  </>
                ) : (
                  'Inativar'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

