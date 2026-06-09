import ShopLayout from '@/components/layout/ShopLayout';

export const dynamic = 'force-dynamic';

export default function Layout({ children }) {
  return <ShopLayout>{children}</ShopLayout>;
}

