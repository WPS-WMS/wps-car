'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  CheckCircle2,
  ExternalLink,
  Loader2,
  MessageCircle,
  Plus,
  UserRound,
} from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import {
  buildWhatsAppLink,
  contactChannelLabels,
  leadSourceLabels,
  leadStatusLabels,
  opportunityStatusLabels,
} from '@/lib/crm-labels';
import { formatCurrency, formatDate } from '@/lib/format';
import { hasPermission } from '@/lib/permissions';
import type {
  ContactChannel,
  CrmLead,
  CrmLeadDetail,
  LeadSource,
  LeadStatus,
} from '@/types/api';
import { useAuth } from '@/providers/auth-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { FormSelect, FormTextarea } from '@/components/vehicles/form-field';

const LEAD_STATUS_OPTIONS = Object.entries(leadStatusLabels).map(([value, label]) => ({
  value,
  label,
}));

const LEAD_SOURCE_OPTIONS = Object.entries(leadSourceLabels).map(([value, label]) => ({
  value,
  label,
}));

const CONTACT_CHANNEL_OPTIONS = Object.entries(contactChannelLabels).map(([value, label]) => ({
  value,
  label,
}));

function leadStatusVariant(status: LeadStatus): 'default' | 'secondary' | 'success' | 'destructive' {
  if (status === 'WON') return 'success';
  if (status === 'LOST') return 'destructive';
  if (status === 'NEGOTIATION' || status === 'QUALIFIED') return 'default';
  return 'secondary';
}

function emptyLeadForm(sellerId?: string) {
  return {
    name: '',
    phone: '',
    email: '',
    source: 'WHATSAPP' as LeadSource,
    notes: '',
    sellerId: sellerId ?? '',
    nextFollowUpAt: '',
  };
}

export function CrmPanel() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const canCreate = hasPermission(user, 'crm:create');
  const canUpdate = hasPermission(user, 'crm:update');
  const isManager = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  const [leadPage, setLeadPage] = useState(1);
  const [leadStatusFilter, setLeadStatusFilter] = useState('');
  const [reminderPage, setReminderPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [detailLeadId, setDetailLeadId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('leads');
  const [leadForm, setLeadForm] = useState(() => emptyLeadForm(user?.id));

  const funnelQuery = useQuery({
    queryKey: ['crm', 'funnel'],
    queryFn: () => api.getCrmFunnel(),
  });

  const leadsQuery = useQuery({
    queryKey: ['crm', 'leads', { page: leadPage, status: leadStatusFilter }],
    queryFn: () =>
      api.getCrmLeads({
        page: leadPage,
        limit: 20,
        ...(leadStatusFilter ? { status: leadStatusFilter } : {}),
      }),
  });

  const remindersQuery = useQuery({
    queryKey: ['crm', 'reminders', { page: reminderPage }],
    queryFn: () => api.getCrmReminders({ page: reminderPage, limit: 20, status: 'PENDING' }),
  });

  const sellersQuery = useQuery({
    queryKey: ['users', 'sellers'],
    queryFn: () => api.getUsers({ role: 'SELLER', active: true, limit: 100 }),
    enabled: isManager && createOpen,
  });

  const vehiclesQuery = useQuery({
    queryKey: ['vehicles', 'crm-interest'],
    queryFn: () => api.getVehicles({ page: 1, limit: 100, status: 'IN_STOCK' }),
    enabled: Boolean(detailLeadId),
  });

  const leadDetailQuery = useQuery({
    queryKey: ['crm', 'lead', detailLeadId],
    queryFn: () => api.getCrmLead(detailLeadId!),
    enabled: Boolean(detailLeadId),
  });

  const invalidateCrm = () => {
    queryClient.invalidateQueries({ queryKey: ['crm'] });
  };

  const createLeadMutation = useMutation({
    mutationFn: () =>
      api.createCrmLead({
        name: leadForm.name.trim(),
        phone: leadForm.phone.trim() || undefined,
        email: leadForm.email.trim() || undefined,
        source: leadForm.source,
        notes: leadForm.notes.trim() || undefined,
        ...(leadForm.sellerId ? { sellerId: leadForm.sellerId } : {}),
        ...(leadForm.nextFollowUpAt
          ? { nextFollowUpAt: new Date(`${leadForm.nextFollowUpAt}T09:00:00`).toISOString() }
          : {}),
      }),
    onSuccess: () => {
      toast.success('Lead cadastrado');
      setCreateOpen(false);
      setLeadForm(emptyLeadForm(user?.id));
      invalidateCrm();
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : 'Erro ao cadastrar lead');
    },
  });

  const completeReminderMutation = useMutation({
    mutationFn: (id: string) => api.completeCrmReminder(id),
    onSuccess: () => {
      toast.success('Lembrete concluído');
      invalidateCrm();
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : 'Erro ao concluir lembrete');
    },
  });

  const leads = leadsQuery.data?.data ?? [];
  const leadMeta = leadsQuery.data?.meta;
  const reminders = remindersQuery.data?.data ?? [];
  const reminderMeta = remindersQuery.data?.meta;
  const funnel = funnelQuery.data;

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
      <TabsList>
        <TabsTrigger value="leads">Leads</TabsTrigger>
        <TabsTrigger value="funnel">Funil</TabsTrigger>
        <TabsTrigger value="reminders">Lembretes</TabsTrigger>
      </TabsList>

      <TabsContent value="leads" className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:max-w-[220px]">
            <FormSelect
              label="Filtrar por status"
              value={leadStatusFilter}
              onChange={(value) => {
                setLeadStatusFilter(value);
                setLeadPage(1);
              }}
              options={[{ value: '', label: 'Todos os status' }, ...LEAD_STATUS_OPTIONS]}
            />
          </div>
          {canCreate ? (
            <Button type="button" onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Novo lead
            </Button>
          ) : null}
        </div>

        {leadsQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando leads…</p>
        ) : (
          <>
            <Card className="overflow-hidden border border-border shadow-card">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead>Nome</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">Próximo follow-up</TableHead>
                    <TableHead className="hidden lg:table-cell">Vendedor</TableHead>
                    <TableHead className="w-24" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.map((lead) => (
                    <LeadRow
                      key={lead.id}
                      lead={lead}
                      onOpen={() => setDetailLeadId(lead.id)}
                    />
                  ))}
                  {!leads.length ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                        Nenhum lead encontrado
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </Card>
            <PaginationControls meta={leadMeta} onPageChange={setLeadPage} />
          </>
        )}
      </TabsContent>

      <TabsContent value="funnel">
        {funnelQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando funil…</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Leads por status</CardTitle>
                <CardDescription>Contagem de leads no funil comercial</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-2 sm:grid-cols-2">
                {Object.entries(leadStatusLabels).map(([status, label]) => (
                  <div
                    key={status}
                    className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
                  >
                    <span className="text-sm text-muted-foreground">{label}</span>
                    <span className="text-lg font-semibold">
                      {funnel?.leads[status] ?? 0}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Oportunidades por status</CardTitle>
                <CardDescription>Negociações vinculadas a clientes</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-2 sm:grid-cols-2">
                {Object.entries(opportunityStatusLabels).map(([status, label]) => (
                  <div
                    key={status}
                    className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
                  >
                    <span className="text-sm text-muted-foreground">{label}</span>
                    <span className="text-lg font-semibold">
                      {funnel?.opportunities[status] ?? 0}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}
      </TabsContent>

      <TabsContent value="reminders" className="space-y-4">
        {remindersQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando lembretes…</p>
        ) : (
          <>
            <Card className="overflow-hidden border border-border shadow-card">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead>Título</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead className="hidden md:table-cell">Descrição</TableHead>
                    <TableHead>Tipo</TableHead>
                    {canUpdate ? <TableHead className="w-28" /> : null}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reminders.map((reminder) => (
                    <TableRow key={reminder.id} className="bg-white">
                      <TableCell className="font-medium">{reminder.title}</TableCell>
                      <TableCell>{formatDate(reminder.dueAt)}</TableCell>
                      <TableCell className="hidden max-w-[280px] truncate text-muted-foreground md:table-cell">
                        {reminder.description ?? '—'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={reminder.autoGenerated ? 'secondary' : 'default'}>
                          {reminder.autoGenerated ? 'Automático' : 'Manual'}
                        </Badge>
                      </TableCell>
                      {canUpdate ? (
                        <TableCell>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={completeReminderMutation.isPending}
                            onClick={() => completeReminderMutation.mutate(reminder.id)}
                          >
                            <CheckCircle2 className="mr-1 h-4 w-4" />
                            Concluir
                          </Button>
                        </TableCell>
                      ) : null}
                    </TableRow>
                  ))}
                  {!reminders.length ? (
                    <TableRow>
                      <TableCell
                        colSpan={canUpdate ? 5 : 4}
                        className="py-10 text-center text-muted-foreground"
                      >
                        Nenhum lembrete pendente
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </Card>
            <PaginationControls meta={reminderMeta} onPageChange={setReminderPage} />
          </>
        )}
      </TabsContent>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Novo lead</DialogTitle>
            <DialogDescription>Cadastre um lead comercial para acompanhamento</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <FormSelect
              label="Origem"
              value={leadForm.source}
              onChange={(value) =>
                setLeadForm((prev) => ({ ...prev, source: value as LeadSource }))
              }
              options={LEAD_SOURCE_OPTIONS}
            />
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome *</label>
              <Input
                value={leadForm.name}
                onChange={(e) => setLeadForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Nome do lead"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Telefone</label>
                <Input
                  value={leadForm.phone}
                  onChange={(e) => setLeadForm((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder="(11) 99999-9999"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">E-mail</label>
                <Input
                  type="email"
                  value={leadForm.email}
                  onChange={(e) => setLeadForm((prev) => ({ ...prev, email: e.target.value }))}
                />
              </div>
            </div>
            {isManager ? (
              <FormSelect
                label="Vendedor"
                value={leadForm.sellerId}
                onChange={(value) => setLeadForm((prev) => ({ ...prev, sellerId: value }))}
                options={[
                  { value: '', label: 'Sem vendedor' },
                  ...(sellersQuery.data?.data ?? []).map((seller) => ({
                    value: seller.id,
                    label: seller.name,
                  })),
                ]}
              />
            ) : null}
            <div className="space-y-2">
              <label className="text-sm font-medium">Próximo follow-up</label>
              <Input
                type="date"
                value={leadForm.nextFollowUpAt}
                onChange={(e) =>
                  setLeadForm((prev) => ({ ...prev, nextFollowUpAt: e.target.value }))
                }
              />
            </div>
            <FormTextarea
              label="Observações"
              value={leadForm.notes}
              onChange={(e) => setLeadForm((prev) => ({ ...prev, notes: e.target.value }))}
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Cancelar
              </Button>
              <Button
                type="button"
                disabled={!leadForm.name.trim() || createLeadMutation.isPending}
                onClick={() => createLeadMutation.mutate()}
              >
                {createLeadMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <LeadDetailDialog
        leadId={detailLeadId}
        lead={leadDetailQuery.data}
        isLoading={leadDetailQuery.isLoading}
        canUpdate={canUpdate}
        canCreate={canCreate}
        vehicles={vehiclesQuery.data?.data ?? []}
        onClose={() => setDetailLeadId(null)}
        onUpdated={invalidateCrm}
      />
    </Tabs>
  );
}

function LeadRow({ lead, onOpen }: { lead: CrmLead; onOpen: () => void }) {
  const whatsapp = buildWhatsAppLink(lead.phone);

  return (
    <TableRow className="bg-white">
      <TableCell>
        <button
          type="button"
          onClick={onOpen}
          className="font-medium text-foreground hover:text-brand-600 hover:underline"
        >
          {lead.name}
        </button>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <span>{lead.phone ?? '—'}</span>
          {whatsapp ? (
            <a
              href={whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-600 hover:text-green-700"
              title="Abrir WhatsApp"
            >
              <MessageCircle className="h-4 w-4" />
            </a>
          ) : null}
        </div>
      </TableCell>
      <TableCell>{leadSourceLabels[lead.source]}</TableCell>
      <TableCell>
        <Badge variant={leadStatusVariant(lead.status)}>{leadStatusLabels[lead.status]}</Badge>
      </TableCell>
      <TableCell className="hidden md:table-cell">
        {lead.nextFollowUpAt ? formatDate(lead.nextFollowUpAt) : '—'}
      </TableCell>
      <TableCell className="hidden lg:table-cell">{lead.seller?.name ?? '—'}</TableCell>
      <TableCell>
        <Button type="button" size="sm" variant="ghost" onClick={onOpen}>
          <UserRound className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}

function LeadDetailDialog({
  leadId,
  lead,
  isLoading,
  canUpdate,
  canCreate,
  vehicles,
  onClose,
  onUpdated,
}: {
  leadId: string | null;
  lead: CrmLeadDetail | undefined;
  isLoading: boolean;
  canUpdate: boolean;
  canCreate: boolean;
  vehicles: Array<{ id: string; brand: string; model: string; licensePlate: string | null }>;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<LeadStatus>('NEW');
  const [followUpDate, setFollowUpDate] = useState('');
  const [contactChannel, setContactChannel] = useState<ContactChannel>('WHATSAPP');
  const [contactSummary, setContactSummary] = useState('');
  const [contactDate, setContactDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [interestVehicleId, setInterestVehicleId] = useState('');
  const [interestNotes, setInterestNotes] = useState('');

  const open = Boolean(leadId);

  const updateLeadMutation = useMutation({
    mutationFn: () =>
      api.updateCrmLead(leadId!, {
        status,
        ...(followUpDate
          ? { nextFollowUpAt: new Date(`${followUpDate}T09:00:00`).toISOString() }
          : { nextFollowUpAt: null }),
      }),
    onSuccess: () => {
      toast.success('Lead atualizado');
      queryClient.invalidateQueries({ queryKey: ['crm', 'lead', leadId] });
      onUpdated();
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : 'Erro ao atualizar lead');
    },
  });

  const addContactMutation = useMutation({
    mutationFn: () =>
      api.createCrmLeadContact(leadId!, {
        channel: contactChannel,
        summary: contactSummary.trim(),
        contactedAt: new Date(`${contactDate}T12:00:00`).toISOString(),
      }),
    onSuccess: () => {
      toast.success('Contato registrado');
      setContactSummary('');
      queryClient.invalidateQueries({ queryKey: ['crm', 'lead', leadId] });
      onUpdated();
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : 'Erro ao registrar contato');
    },
  });

  const addInterestMutation = useMutation({
    mutationFn: () =>
      api.createCrmLeadInterest(leadId!, {
        vehicleId: interestVehicleId,
        notes: interestNotes.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success('Interesse registrado');
      setInterestVehicleId('');
      setInterestNotes('');
      queryClient.invalidateQueries({ queryKey: ['crm', 'lead', leadId] });
      onUpdated();
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : 'Erro ao registrar interesse');
    },
  });

  const whatsapp = buildWhatsAppLink(lead?.phone);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
        if (next && lead) {
          setStatus(lead.status);
          setFollowUpDate(
            lead.nextFollowUpAt
              ? new Date(lead.nextFollowUpAt).toISOString().slice(0, 10)
              : '',
          );
        }
      }}
    >
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{lead?.name ?? 'Lead'}</DialogTitle>
          <DialogDescription>Histórico de contato e interesse por veículo</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : lead ? (
          <div className="space-y-6">
            <div className="grid gap-3 rounded-lg border border-border p-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">Telefone</p>
                <div className="flex items-center gap-2">
                  <p>{lead.phone ?? '—'}</p>
                  {whatsapp ? (
                    <a
                      href={whatsapp}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-green-600 hover:underline"
                    >
                      WhatsApp
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : null}
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">E-mail</p>
                <p>{lead.email ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Origem</p>
                <p>{leadSourceLabels[lead.source]}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Valor esperado</p>
                <p>{formatCurrency(lead.expectedAmount)}</p>
              </div>
              {lead.notes ? (
                <div className="sm:col-span-2">
                  <p className="text-xs text-muted-foreground">Observações</p>
                  <p className="text-sm">{lead.notes}</p>
                </div>
              ) : null}
            </div>

            {canUpdate ? (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Atualizar lead</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <FormSelect
                    label="Status"
                    value={status}
                    onChange={(value) => setStatus(value as LeadStatus)}
                    options={LEAD_STATUS_OPTIONS}
                  />
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Próximo follow-up</label>
                    <Input
                      type="date"
                      value={followUpDate}
                      onChange={(e) => setFollowUpDate(e.target.value)}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Button
                      type="button"
                      disabled={updateLeadMutation.isPending}
                      onClick={() => updateLeadMutation.mutate()}
                    >
                      Salvar alterações
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : null}

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Histórico de contato</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {lead.contacts.length ? (
                  <ul className="space-y-3">
                    {lead.contacts.map((contact) => (
                      <li key={contact.id} className="rounded-lg border border-border p-3 text-sm">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <Badge variant="secondary">
                            {contactChannelLabels[contact.channel]}
                          </Badge>
                          <span className="text-muted-foreground">
                            {formatDate(contact.contactedAt)}
                          </span>
                        </div>
                        <p className="mt-2">{contact.summary}</p>
                        {contact.whatsappLink ? (
                          <a
                            href={contact.whatsappLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 inline-flex items-center gap-1 text-green-600 hover:underline"
                          >
                            Abrir WhatsApp
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhum contato registrado</p>
                )}

                {canCreate ? (
                  <div className="grid gap-3 border-t border-border pt-4 sm:grid-cols-2">
                    <FormSelect
                      label="Canal"
                      value={contactChannel}
                      onChange={(value) => setContactChannel(value as ContactChannel)}
                      options={CONTACT_CHANNEL_OPTIONS}
                    />
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Data do contato</label>
                      <Input
                        type="date"
                        value={contactDate}
                        onChange={(e) => setContactDate(e.target.value)}
                      />
                    </div>
                    <div className="sm:col-span-2 space-y-2">
                      <label className="text-sm font-medium">Resumo *</label>
                      <Input
                        value={contactSummary}
                        onChange={(e) => setContactSummary(e.target.value)}
                        placeholder="O que foi conversado?"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Button
                        type="button"
                        variant="outline"
                        disabled={!contactSummary.trim() || addContactMutation.isPending}
                        onClick={() => addContactMutation.mutate()}
                      >
                        Registrar contato
                      </Button>
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Interesse por veículo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {lead.interests.length ? (
                  <ul className="space-y-2">
                    {lead.interests.map((interest) => (
                      <li
                        key={interest.id}
                        className="rounded-lg border border-border px-3 py-2 text-sm"
                      >
                        <p className="font-medium">
                          {interest.vehicle
                            ? `${interest.vehicle.brand} ${interest.vehicle.model}${
                                interest.vehicle.licensePlate
                                  ? ` · ${interest.vehicle.licensePlate}`
                                  : ''
                              }`
                            : 'Veículo removido'}
                        </p>
                        {interest.notes ? (
                          <p className="text-muted-foreground">{interest.notes}</p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhum veículo de interesse</p>
                )}

                {canCreate ? (
                  <div className="grid gap-3 border-t border-border pt-4">
                    <FormSelect
                      label="Veículo"
                      value={interestVehicleId}
                      onChange={setInterestVehicleId}
                      options={[
                        { value: '', label: 'Selecione…' },
                        ...vehicles.map((vehicle) => ({
                          value: vehicle.id,
                          label: `${vehicle.brand} ${vehicle.model}${
                            vehicle.licensePlate ? ` · ${vehicle.licensePlate}` : ''
                          }`,
                        })),
                      ]}
                    />
                    <FormTextarea
                      label="Observações"
                      value={interestNotes}
                      onChange={(e) => setInterestNotes(e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      disabled={!interestVehicleId || addInterestMutation.isPending}
                      onClick={() => addInterestMutation.mutate()}
                    >
                      Adicionar interesse
                    </Button>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Lead não encontrado</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
