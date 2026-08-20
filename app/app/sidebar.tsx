import { useEffect } from 'react';
import { useRouter } from 'expo-router';

/** Sidebar was retired as a primary nav surface — keep the route for old links. */
export default function SidebarScreen() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/(tabs)/more' as never);
  }, [router]);
  return null;
}
