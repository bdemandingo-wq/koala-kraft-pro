import { useOrganization } from '@/contexts/OrganizationContext';

/**
 * Hook to get organization_id for database queries.
 * All data queries should include this organization_id to ensure
 * proper multi-tenant data isolation.
 */
export function useOrgId() {
  const { organization, loading } = useOrganization();
  return {
    organizationId: organization?.id ?? null,
    loading,
    hasOrganization: !!organization,
  };
}
