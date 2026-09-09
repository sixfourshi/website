import { redirect } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { getScripts } from '@/lib/scripts';
import { DashboardClient } from '@/components/DashboardClient';

export default async function DashboardPage() {
  const authed = await isAuthenticated();
  if (!authed) redirect('/login');

  const scripts = await getScripts();

  return <DashboardClient initialScripts={scripts} />;
}
