import { Suspense } from 'react';
import RedefinirSenhaForm from './redefinir-senha-form';

export default function RedefinirSenhaPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-page-gradient p-6 text-sm text-muted-foreground">
          Carregando…
        </div>
      }
    >
      <RedefinirSenhaForm />
    </Suspense>
  );
}
