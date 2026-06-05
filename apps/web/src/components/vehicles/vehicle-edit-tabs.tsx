'use client';

import { useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Car, Coins, Receipt } from 'lucide-react';
import type { Vehicle } from '@/types/api';
import { vehicleEditHref } from '@/lib/edit-routes';
import { hasPermission } from '@/lib/permissions';
import { useAuth } from '@/providers/auth-provider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VehicleForm } from './vehicle-form';
import { VehicleFinancialForm } from './vehicle-financial-form';
import { VehicleCostsPanel } from './vehicle-costs-panel';

const TAB_IDS = ['dados', 'financeiro', 'custos'] as const;
type TabId = (typeof TAB_IDS)[number];

function isTabId(value: string | null): value is TabId {
  return TAB_IDS.includes(value as TabId);
}

export function VehicleEditTabs({
  vehicleId,
  initialData,
}: {
  vehicleId: string;
  initialData: Vehicle;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const canUpdateVehicle = hasPermission(user, 'vehicles:update');
  const canReadFinancial = hasPermission(user, 'financial:read');
  const canUpdateFinancial = hasPermission(user, 'financial:update');
  const canReadCosts = hasPermission(user, 'costs:read');
  const canManageCosts = hasPermission(user, 'costs:create');

  const tabFromUrl = searchParams.get('tab');
  const activeTab: TabId = useMemo(() => {
    if (isTabId(tabFromUrl)) {
      if (tabFromUrl === 'financeiro' && !canReadFinancial) return 'dados';
      if (tabFromUrl === 'custos' && !canReadCosts) return 'dados';
      return tabFromUrl;
    }
    return 'dados';
  }, [tabFromUrl, canReadFinancial, canReadCosts]);

  const setTab = useCallback(
    (tab: string) => {
      const tabParam = tab === 'dados' ? undefined : tab;
      router.replace(vehicleEditHref(vehicleId, tabParam ? { tab: tabParam } : undefined), {
        scroll: false,
      });
    },
    [router, vehicleId],
  );

  return (
    <Tabs value={activeTab} onValueChange={setTab}>
      <TabsList>
        <TabsTrigger value="dados">
          <Car className="mr-2 h-4 w-4" />
          Dados
        </TabsTrigger>
        {canReadFinancial ? (
          <TabsTrigger value="financeiro">
            <Coins className="mr-2 h-4 w-4" />
            Financeiro
          </TabsTrigger>
        ) : null}
        {canReadCosts ? (
          <TabsTrigger value="custos">
            <Receipt className="mr-2 h-4 w-4" />
            Custos
          </TabsTrigger>
        ) : null}
      </TabsList>

      <TabsContent value="dados">
        <VehicleForm
          mode="edit"
          vehicleId={vehicleId}
          initialData={initialData}
          sections="data-only"
        />
      </TabsContent>

      {canReadFinancial ? (
        <TabsContent value="financeiro">
          <VehicleFinancialForm vehicleId={vehicleId} canUpdate={canUpdateFinancial} />
        </TabsContent>
      ) : null}

      {canReadCosts ? (
        <TabsContent value="custos">
          <VehicleCostsPanel vehicleId={vehicleId} canManage={canManageCosts} />
        </TabsContent>
      ) : null}
    </Tabs>
  );
}
