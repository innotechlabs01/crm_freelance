import { useUser } from '@/hooks/use-user'

export function usePermission(permission: string): boolean {
  const { canAccess } = useUser()
  return canAccess(permission)
}
