'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useAuth, useUser as useClerkUser } from '@clerk/nextjs';

interface AuthContextType {
  user: { id: string; email: string } | null;
  plan: { id: string; name: string; display_name: string; max_clients: number | null; max_invoices_per_month: number | null; price: number } | null;
  subscription: { status: string; renewal_at: string | null } | null;
  permissions: string[];
  isLoading: boolean;
  canAccess: (permission: string) => boolean;
  isFree: boolean;
  isProfessional: boolean;
  isEnterprise: boolean;
  clientCount: number;
  monthlyInvoiceCount: number;
  refreshLimits: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null, plan: null, subscription: null, permissions: [],
  isLoading: true, canAccess: () => false, isFree: true,
  isProfessional: false, isEnterprise: false,
  clientCount: 0, monthlyInvoiceCount: 0, refreshLimits: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const { isSignedIn, getToken } = useAuth();
  const { user: clerkUser } = useClerkUser();
  const [plan, setPlan] = useState<AuthContextType['plan']>(null);
  const [subscription, setSubscription] = useState<AuthContextType['subscription']>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [clientCount, setClientCount] = useState(0);
  const [monthlyInvoiceCount, setMonthlyInvoiceCount] = useState(0);

  const user = clerkUser ? { id: clerkUser.id, email: clerkUser.primaryEmailAddress?.emailAddress || '' } : null;

  const fetchMe = useCallback(async () => {
    if (!isSignedIn) { setIsLoading(false); return; }
    try {
      const token = await getToken();
      const res = await fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setPlan(data.plan);
        setSubscription(data.subscription);
        setPermissions(data.permissions || []);
        setClientCount(data.clientCount || 0);
        setMonthlyInvoiceCount(data.monthlyInvoiceCount || 0);
      }
    } catch (e) { console.error('Failed to fetch user data', e); }
    setIsLoading(false);
  }, [isSignedIn, getToken]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchMe(); }, [fetchMe]);

  const refreshLimits = useCallback(async () => {
    if (!isSignedIn) return;
    try {
      const token = await getToken();
      const res = await fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setClientCount(data.clientCount || 0);
        setMonthlyInvoiceCount(data.monthlyInvoiceCount || 0);
        setPlan(data.plan);
        setSubscription(data.subscription);
        setPermissions(data.permissions || []);
      }
    } catch (e) { console.error('Failed to refresh limits', e); }
  }, [isSignedIn, getToken]);

  const canAccess = useCallback((p: string) => permissions.includes(p), [permissions]);
  const planName = plan?.name || 'free';
  const isFree = planName === 'free';
  const isProfessional = planName === 'professional';
  const isEnterprise = planName === 'enterprise';

  return (
    <AuthContext.Provider value={{ user, plan, subscription, permissions, isLoading, canAccess, isFree, isProfessional, isEnterprise, clientCount, monthlyInvoiceCount, refreshLimits }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() { return useContext(AuthContext); }
