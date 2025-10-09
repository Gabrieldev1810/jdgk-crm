import { useState, useEffect } from 'react';
import { usersService } from '@/services';

interface UserPermission {
  id: string;
  code: string;
  name: string;
  description: string;
  category: string;
  resource: string;
  action: string;
}

export function useUserPermissions(userId: string | null) {
  const [permissions, setPermissions] = useState<UserPermission[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setPermissions([]);
      return;
    }

    const fetchPermissions = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        console.log(`🔑 Fetching permissions for user: ${userId}`);
        const userPermissions = await usersService.getUserPermissions(userId);
        console.log(`✅ Loaded ${userPermissions.length} permissions:`, userPermissions.map(p => p.code));
        setPermissions(userPermissions);
      } catch (err) {
        console.error('❌ Failed to fetch user permissions:', err);
        console.error('❌ Error details:', {
          status: err.status || 'Unknown',
          message: err.message || 'Unknown error',
          response: err.response || 'No response'
        });
        setError(err instanceof Error ? err.message : 'Failed to fetch permissions');
        setPermissions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPermissions();
  }, [userId]);

  const hasPermission = (permissionCode: string): boolean => {
    return permissions.some(p => p.code === permissionCode);
  };

  const hasAnyPermission = (permissionCodes: string[]): boolean => {
    return permissionCodes.some(code => hasPermission(code));
  };

  const getPermissionsByCategory = (category: string): UserPermission[] => {
    return permissions.filter(p => p.category === category);
  };

  return {
    permissions,
    isLoading,
    error,
    hasPermission,
    hasAnyPermission,
    getPermissionsByCategory,
    refetch: () => {
      if (userId) {
        const fetchPermissions = async () => {
          setIsLoading(true);
          setError(null);
          
          try {
            const userPermissions = await usersService.getUserPermissions(userId);
            setPermissions(userPermissions);
          } catch (err) {
            console.error('Failed to fetch user permissions:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch permissions');
          } finally {
            setIsLoading(false);
          }
        };
        fetchPermissions();
      }
    }
  };
}