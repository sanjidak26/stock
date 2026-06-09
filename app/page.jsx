import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { initDb } from '@/lib/mongoDb';
import LandingPage from '@/components/landing/LandingPage';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Stock Easy — Smart Pharmacy Stock Management',
  description: 'Eliminate medicine expiry waste with FEFO billing, AI insights, and real-time analytics.',
};

export default async function Home() {
  await initDb();
  const session = await getServerSession(authOptions);
  if (session) {
    redirect(session.user.role === 'central_admin' ? '/admin' : '/dashboard');
  }
  return <LandingPage />;
}
