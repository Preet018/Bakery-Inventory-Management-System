import React from 'react';
import { RoleLoginForm } from '../../components/auth/RoleLoginForm';

/**
 * NEW FILE: CustomerLoginPage Component
 * Dedicated login portal for Bakery Customers.
 */
export const CustomerLoginPage = () => {
  return (
    <RoleLoginForm
      roleKey="customer"
      roleBadge="CUSTOMER"
      title="Customer Portal Sign In"
      subtitle="Sign in to browse freshly baked goods, manage your cart, and track orders"
    />
  );
};
