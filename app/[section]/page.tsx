import { notFound } from 'next/navigation';
import Studio from '../studio';

const views: Record<string, string> = {
  visaogeral: 'dashboard',
  calendario: 'calendar',
  publicacao: 'posts',
  publicacoes: 'posts',
  aprovacoes: 'approvals',
  clientes: 'clients',
  integracoes: 'integrations',
};

export default async function SectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  const initialView = views[section];
  if (!initialView) notFound();
  return <Studio initialView={initialView} />;
}
