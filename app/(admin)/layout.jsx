import AdminLayout from '@/components/layout/AdminLayout';

export const dynamic = 'force-dynamic';

export default function Layout({ children }) {
  return <AdminLayout>{children}</AdminLayout>;
}
