import React from 'react';
import { RoleLoginForm } from '../../components/auth/RoleLoginForm';

/**
 * NEW FILE: ManagerLoginPage Component
 * Dedicated login portal for Bakery Inventory Managers.
 */
export const ManagerLoginPage = () => {
  return (
    <RoleLoginForm
      roleKey="manager"
      roleBadge="INVENTORY MANAGER"
      title="Inventory Manager Sign In"
      subtitle="Access real-time stock levels, record purchases, damages, and vendor adjustments"
    />
  );
};
