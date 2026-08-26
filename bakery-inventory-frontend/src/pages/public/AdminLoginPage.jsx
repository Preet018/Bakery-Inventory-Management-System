import React from 'react';
import { RoleLoginForm } from '../../components/auth/RoleLoginForm';

/**
 * NEW FILE: AdminLoginPage Component
 * Dedicated login portal for Bakery System Administrators.
 */
export const AdminLoginPage = () => {
  return (
    <RoleLoginForm
      roleKey="admin"
      roleBadge="ADMINISTRATOR"
      title="Administrator Portal Sign In"
      subtitle="Access administrative controls, category management, and staff user provisioning"
    />
  );
};
