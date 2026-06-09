'use client';

import { useMemo, useState } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { api, ApiError } from '@/lib/api';
import { commissionTypeOptions, isPercentageCommission } from '@/lib/commission-labels';
import type { TenantUser } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SearchBar } from '@/components/ui/search-bar';
import { SelectFilter } from '@/components/ui/select-filter';
import { Toolbar } from '@/components/ui/toolbar';
import { ActionMenu } from '@/components/ui/action-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { FormField, FormNativeSelect, FormTextarea } from '@/components/vehicles/form-field';
import { BranchAssignmentField } from '@/components/users/branch-assignment-field';
import { RoleBadge, StatusBadge } from '@/components/users/user-badges';
import { branchIdToPayload, userBranchLabel } from '@/hooks/use-tenant-branch-options';
import { requiresBranchAssignment } from '@/lib/user-branch-rules';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const roleOptions = [
  { value: '', label: 'Todos os perfis' },
  { value: 'ADMIN', label: 'Administrador' },
  { value: 'MANAGER', label: 'Gerente' },
  { value: 'SELLER', label: 'Vendedor' },
];

const statusOptions = [
  { value: '', label: 'Todos os status' },
  { value: 'active', label: 'Ativo' },
  { value: 'inactive', label: 'Inativo' },
];

const createSchema = z.object({
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
type CreateValues = z.infer<typeof createSchema>;

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

function emptyCreate(): CreateValues {
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

export function UsersManagement({ sellerOnly = false }: { sellerOnly?: boolean }) {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [role, setRole] = useState(sellerOnly ? 'SELLER' : '');
  const [status, setStatus] = useState('');

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<TenantUser | null>(null);

  const usersQuery = useQuery({
    queryKey: ['users', { search, role, status }],
    queryFn: () =>
      api.getUsers({
        page: 1,
        limit: 100,
        ...(search ? { search } : {}),
        ...(role ? { role } : {}),
        ...(status === 'active' ? { active: true } : {}),
        ...(status === 'inactive' ? { active: false } : {}),
      }),
  });

  const users = usersQuery.data?.data ?? [];

  const {
    register: registerCreate,
    handleSubmit: handleSubmitCreate,
    watch: watchCreate,
    setValue: setValueCreate,
    reset: resetCreate,
    formState: { errors: createErrors, isSubmitting: isSubmittingCreate },
  } = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: emptyCreate(),
  });

  const createRole = watchCreate('role');
  const createCommissionType = watchCreate('commissionType') ?? '';
  const showCreateCommission = createRole === 'SELLER';
  const createRequiresValue =
    showCreateCommission && createCommissionType && createCommissionType !== 'CUSTOM_PER_VEHICLE';

  const createCommissionValueLabel = useMemo(() => {
    if (!createCommissionType) return 'Valor';
    if (createCommissionType === 'CUSTOM_PER_VEHICLE') return 'Sem valor';
    return isPercentageCommission(createCommissionType) ? 'Percentual (%)' : 'Valor (R$)';
  }, [createCommissionType]);

  const createMutation = useMutation({
    mutationFn: async (values: CreateValues) => {
      const payload: Record<string, unknown> = {
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password,
        role: values.role,
        phone: values.phone?.trim() || undefined,
        address: values.address?.trim() || undefined,
      };
      if (requiresBranchAssignment(values.role)) {
        payload.branchId = branchIdToPayload(values.branchId);
      }
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
      setCreateOpen(false);
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
  } = useForm<EditValues>({ resolver: zodResolver(editSchema) });

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
        phone: values.phone?.trim() || undefined,
        address: values.address?.trim() || undefined,
      };
      if (requiresBranchAssignment(values.role)) {
        payload.branchId = branchIdToPayload(values.branchId);
      }
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

  const {
    register: registerDeactivate,
    handleSubmit: handleSubmitDeactivate,
    reset: resetDeactivate,
    formState: { errors: deactErrors, isSubmitting: isSubmittingDeactivate },
  } = useForm<DeactivateValues>({
    resolver: zodResolver(deactivateSchema),
    defaultValues: { reason: '' },
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
    <div className="space-y-4">
      <Toolbar
        left={
          <>
            <SearchBar
              className="flex-1"
              placeholder="Buscar por nome ou e-mail…"
              value={search}
              onChange={setSearch}
            />
            {sellerOnly ? null : (
              <SelectFilter
                value={role}
                onChange={setRole}
                options={roleOptions}
                placeholder="Perfil"
                ariaLabel="Filtrar por perfil"
              />
            )}
            <SelectFilter
              value={status}
              onChange={setStatus}
              options={statusOptions}
              placeholder="Status"
              ariaLabel="Filtrar por status"
            />
          </>
        }
        right={
          <Dialog
            modal={false}
            open={createOpen}
            onOpenChange={(v) => {
              setCreateOpen(v);
              if (v) resetCreate(emptyCreate());
            }}
          >
            <DialogTrigger asChild>
              <Button type="button" className="h-11 gap-2">
                <UserPlus className="h-4 w-4" />
                {sellerOnly ? 'Novo vendedor' : 'Novo usuário'}
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
                onSubmit={handleSubmitCreate((v) => createMutation.mutateAsync(v))}
                className="max-h-[calc(90vh-8rem)] space-y-4 overflow-y-auto pr-1"
              >
                <FormField label="Nome" required error={createErrors.name?.message}>
                  <Input {...registerCreate('name')} />
                </FormField>

                <FormField label="E-mail" required error={createErrors.email?.message}>
                  <Input type="email" {...registerCreate('email')} />
                </FormField>

                <FormField label="Senha" required error={createErrors.password?.message}>
                  <Input type="password" {...registerCreate('password')} />
                </FormField>

                {sellerOnly ? null : (
                  <FormNativeSelect
                    label="Tipo de usuário"
                    required
                    value={createRole}
                    onChange={(v) => {
                      setValueCreate('role', v as CreateValues['role'], { shouldValidate: true });
                      if (v === 'ADMIN') {
                        setValueCreate('branchId', '', { shouldValidate: true });
                      }
                    }}
                    options={roleOptions.filter((o) => o.value) as any}
                    error={createErrors.role?.message}
                  />
                )}

                {requiresBranchAssignment(createRole) ? (
                  <BranchAssignmentField
                    value={watchCreate('branchId') ?? ''}
                    onChange={(v) =>
                      setValueCreate('branchId', v, { shouldValidate: true, shouldDirty: true })
                    }
                    error={createErrors.branchId?.message}
                  />
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Administrador fica sempre na matriz (visão de toda a empresa).
                  </p>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField label="Telefone" error={createErrors.phone?.message}>
                    <Input {...registerCreate('phone')} placeholder="Opcional" />
                  </FormField>
                  <FormField label="Endereço" error={createErrors.address?.message}>
                    <Input {...registerCreate('address')} placeholder="Opcional" />
                  </FormField>
                </div>

                {(sellerOnly || showCreateCommission) ? (
                  <div className="rounded-lg border border-border bg-muted/20 p-3">
                    <h3 className="text-sm font-semibold text-foreground">Comissão do vendedor</h3>
                    <div className="mt-3 grid gap-4 sm:grid-cols-2">
                      <FormNativeSelect
                        label="Tipo de comissão"
                        required
                        value={createCommissionType}
                        onChange={(v) =>
                          setValueCreate('commissionType', v, {
                            shouldValidate: true,
                            shouldDirty: true,
                          })
                        }
                        options={commissionTypeOptions as any}
                        error={createErrors.commissionType?.message}
                      />
                      {createRequiresValue ? (
                        <FormField
                          label={createCommissionValueLabel}
                          required
                          error={createErrors.commissionValue?.message}
                        >
                          <Input
                            type="number"
                            step="0.0001"
                            value={String(watchCreate('commissionValue') ?? '')}
                            onChange={(e) =>
                              setValueCreate(
                                'commissionValue',
                                e.target.value === '' ? undefined : Number(e.target.value),
                                { shouldValidate: true, shouldDirty: true },
                              )
                            }
                          />
                        </FormField>
                      ) : (
                        <FormField label={createCommissionValueLabel}>
                          <Input disabled value="—" />
                        </FormField>
                      )}
                    </div>
                  </div>
                ) : null}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmittingCreate || createMutation.isPending}
                >
                  {isSubmittingCreate || createMutation.isPending ? (
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
        }
      />

      <Card className="border border-border bg-card shadow-card">
        <CardContent className="p-0">
          {/* Desktop table */}
          <div className="hidden sm:block">
            <Table className="w-full">
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-muted/30">
                  <TableHead className="h-12 px-4 text-xs font-medium text-muted-foreground">
                    Nome
                  </TableHead>
                  <TableHead className="h-12 px-4 text-xs font-medium text-muted-foreground">
                    E-mail
                  </TableHead>
                  <TableHead className="h-12 px-4 text-xs font-medium text-muted-foreground">
                    Perfil
                  </TableHead>
                  <TableHead className="h-12 px-4 text-xs font-medium text-muted-foreground">
                    Loja
                  </TableHead>
                  <TableHead className="h-12 px-4 text-xs font-medium text-muted-foreground">
                    Status
                  </TableHead>
                  <TableHead className="h-12 px-4 text-right text-xs font-medium text-muted-foreground">
                    Ações
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usersQuery.isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">
                      Carregando usuários…
                    </TableCell>
                  </TableRow>
                ) : users.length ? (
                  users.map((u) => (
                    <TableRow key={u.id} className="hover:bg-muted/20">
                      <TableCell className="px-4 py-4 font-medium">{u.name}</TableCell>
                      <TableCell className="px-4 py-4 text-sm text-muted-foreground">
                        {u.email}
                      </TableCell>
                      <TableCell className="px-4 py-4">
                        <RoleBadge role={u.role} />
                      </TableCell>
                      <TableCell className="px-4 py-4 text-sm text-muted-foreground">
                        {userBranchLabel(u)}
                      </TableCell>
                      <TableCell className="px-4 py-4">
                        <StatusBadge active={u.active} />
                      </TableCell>
                      <TableCell className="px-4 py-4 text-right">
                        <ActionMenu
                          items={[
                            { key: 'edit', label: 'Editar', onSelect: () => openEdit(u) },
                            ...(u.active === false
                              ? [
                                  {
                                    key: 'activate',
                                    label: 'Ativar',
                                    onSelect: () => activateMutation.mutate(u),
                                  },
                                ]
                              : [
                                  {
                                    key: 'deactivate',
                                    label: 'Desativar',
                                    destructive: true,
                                    onSelect: () => openDeactivate(u),
                                    separatorBefore: true,
                                  },
                                ]),
                            {
                              key: 'reset',
                              label: 'Resetar senha',
                              onSelect: () =>
                                toast.message('Em breve: resetar senha pelo painel'),
                              separatorBefore: true,
                            },
                            {
                              key: 'profile',
                              label: 'Alterar perfil',
                              onSelect: () =>
                                toast.message('Em breve: alterar perfil pelo painel'),
                            },
                          ]}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">
                      Nenhum usuário encontrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile cards */}
          <div className="block sm:hidden">
            <div className="divide-y divide-border">
              {usersQuery.isLoading ? (
                <div className="p-4 text-sm text-muted-foreground">Carregando usuários…</div>
              ) : users.length ? (
                users.map((u) => (
                  <div key={u.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">{u.name}</p>
                        <p className="truncate text-sm text-muted-foreground">{u.email}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Loja: {userBranchLabel(u)}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <RoleBadge role={u.role} />
                          <StatusBadge active={u.active} />
                        </div>
                      </div>
                      <ActionMenu
                        items={[
                          { key: 'edit', label: 'Editar', onSelect: () => openEdit(u) },
                          ...(u.active === false
                            ? [{ key: 'activate', label: 'Ativar', onSelect: () => activateMutation.mutate(u) }]
                            : [
                                {
                                  key: 'deactivate',
                                  label: 'Desativar',
                                  destructive: true,
                                  onSelect: () => openDeactivate(u),
                                },
                              ]),
                        ]}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-sm text-muted-foreground">Nenhum usuário encontrado</div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit dialog */}
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

            {sellerOnly ? null : (
              <FormNativeSelect
                label="Tipo de usuário"
                required
                value={editRole ?? 'SELLER'}
                onChange={(v) => {
                  setValueEdit('role', v as any, { shouldValidate: true });
                  if (v === 'ADMIN') {
                    setValueEdit('branchId', '', { shouldValidate: true });
                  }
                }}
                options={roleOptions.filter((o) => o.value) as any}
                error={editErrors.role?.message}
              />
            )}

            {requiresBranchAssignment(editRole ?? 'SELLER') ? (
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
            ) : (
              <p className="text-xs text-muted-foreground">
                Administrador fica sempre na matriz (visão de toda a empresa).
              </p>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Telefone" error={editErrors.phone?.message}>
                <Input {...registerEdit('phone')} placeholder="Opcional" />
              </FormField>
              <FormField label="Endereço" error={editErrors.address?.message}>
                <Input {...registerEdit('address')} placeholder="Opcional" />
              </FormField>
            </div>

            {(sellerOnly || showEditCommission) ? (
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
                    options={commissionTypeOptions as any}
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

      {/* Deactivate dialog */}
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
            <DialogTitle>Desativar usuário</DialogTitle>
            <DialogDescription>Informe o motivo. Esse campo é obrigatório.</DialogDescription>
          </DialogHeader>
          <form
            noValidate
            onSubmit={handleSubmitDeactivate((v) => deactivateMutation.mutateAsync(v))}
            className="space-y-4"
          >
            <FormTextarea
              label="Motivo"
              required
              rows={3}
              error={deactErrors.reason?.message}
              placeholder="Descreva o motivo da desativação…"
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
                    Desativando…
                  </>
                ) : (
                  'Desativar'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

