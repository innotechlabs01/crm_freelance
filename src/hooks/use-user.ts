'use client';
import { useAuthContext } from '@/components/auth/auth-provider';
export function useUser() { return useAuthContext(); }
