import { toast } from 'sonner';
import { clearAuthSession } from './auth-storage';

let sessionRedirectPending = false;

type ApiErrorLike = Error & { statusCode: number; code?: string };

function isApiError(error: unknown): error is ApiErrorLike {
  return (
    error instanceof Error &&
    error.name === 'ApiError' &&
    typeof (error as ApiErrorLike).statusCode === 'number'
  );
}

export function notifySessionExpired() {
  if (typeof window === 'undefined' || sessionRedirectPending) {
    return;
  }

  sessionRedirectPending = true;
  clearAuthSession();
  toast.error('Sessão expirada. Faça login novamente.');

  const onLoginPage =
    window.location.pathname === '/login' ||
    window.location.pathname.startsWith('/redefinir-senha');

  if (!onLoginPage) {
    window.location.href = '/login';
  }
}

export function notifyNetworkError() {
  toast.error('Sem conexão com o servidor. Verifique sua internet.');
}

export function notifyServerError() {
  toast.error('Erro no servidor. Tente novamente em instantes.');
}

/** Toasts globais para falhas que a tela local costuma não tratar. */
export function notifyApiError(error: unknown) {
  if (isApiError(error)) {
    if (error.statusCode === 401 || error.code === 'SESSION_EXPIRED') {
      notifySessionExpired();
      return;
    }

    if (error.statusCode === 0 || error.code === 'NETWORK_ERROR') {
      notifyNetworkError();
      return;
    }

    if (error.statusCode >= 500) {
      notifyServerError();
    }

    return;
  }

  if (error instanceof TypeError) {
    notifyNetworkError();
  }
}

export function resetSessionRedirectFlag() {
  sessionRedirectPending = false;
}
