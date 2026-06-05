'use client';

import * as React from 'react';

const DialogFormContainerContext = React.createContext<React.RefObject<HTMLElement | null> | null>(
  null,
);

export function DialogFormContainerProvider({
  containerRef,
  children,
}: {
  containerRef: React.RefObject<HTMLElement | null>;
  children: React.ReactNode;
}) {
  return (
    <DialogFormContainerContext.Provider value={containerRef}>
      {children}
    </DialogFormContainerContext.Provider>
  );
}

export function useDialogFormContainer() {
  return React.useContext(DialogFormContainerContext);
}

export function useInDialogForm() {
  return Boolean(useDialogFormContainer());
}
