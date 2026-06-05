import { digitsOnly } from './br-input-masks';

export interface ViaCepAddress {
  street: string;
  neighborhood: string;
  city: string;
  state: string;
  complement?: string;
}

export async function fetchAddressByCep(cep: string): Promise<ViaCepAddress | null> {
  const digits = digitsOnly(cep);
  if (digits.length !== 8) return null;

  try {
    const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`, {
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) return null;

    const data = (await res.json()) as {
      erro?: boolean;
      logradouro?: string;
      bairro?: string;
      localidade?: string;
      uf?: string;
      complemento?: string;
    };

    if (data.erro) return null;

    return {
      street: data.logradouro ?? '',
      neighborhood: data.bairro ?? '',
      city: data.localidade ?? '',
      state: data.uf ?? '',
      complement: data.complemento?.trim() || undefined,
    };
  } catch {
    return null;
  }
}
