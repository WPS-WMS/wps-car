'use client';

import { MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export type ActionMenuItem = {
  key: string;
  label: string;
  onSelect: () => void;
  destructive?: boolean;
  disabled?: boolean;
  separatorBefore?: boolean;
};

export function ActionMenu({
  label = 'Ações',
  items,
  disabled,
}: {
  label?: string;
  items: ActionMenuItem[];
  disabled?: boolean;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={label}
            disabled={disabled}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="min-w-44">
        {items.map((item, idx) => (
          <div key={item.key}>
            {item.separatorBefore ? <DropdownMenuSeparator /> : null}
            <DropdownMenuItem
              variant={item.destructive ? 'destructive' : 'default'}
              disabled={item.disabled}
              onClick={() => item.onSelect()}
            >
              {item.label}
            </DropdownMenuItem>
            {idx === items.length - 1 ? null : null}
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

