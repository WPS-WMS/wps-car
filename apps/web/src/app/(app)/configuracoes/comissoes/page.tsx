import { redirect } from 'next/navigation';

export default function ComissoesLegacyRedirect() {
  redirect('/configuracoes/comissao-empresa');
}
