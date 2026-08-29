import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Shield, Package } from 'lucide-react';

/**
 * BackOfficeHeaderBadge component
 *
 * Renders the standardized role badge + last updated timestamp across Admin and Inventory Manager pages:
 * - Admin users: SYSTEM ADMINISTRATOR (Shield icon, blue-tinted badge)
 * - Inventory Manager users: INVENTORY MANAGER (Package icon, amber-tinted badge)
 * - lastUpdated: Formats Date as "Updated HH:MM" (or "Updated HH:MM am/pm")
 */
export const BackOfficeHeaderBadge = ({ lastUpdated, roleOverride, customBadgeText, customIcon: CustomIcon }) => {
  const { isAdmin } = useAuth();

  const isCurrentAdmin = roleOverride ? roleOverride === 'ADMIN' : isAdmin;

  // Determine badge styling and content
  const badgeClass = isCurrentAdmin ? 'backoffice-badge admin-badge' : 'backoffice-badge';
  const IconComponent = CustomIcon || (isCurrentAdmin ? Shield : Package);
  const badgeText = customBadgeText || (isCurrentAdmin ? 'System Administrator' : 'Inventory Manager');

  return (
    <div className="backoffice-badge-row">
      <span className={badgeClass}>
        <IconComponent size={14} /> {badgeText}
      </span>
      {lastUpdated && (
        <span className="last-updated-text">
          Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      )}
    </div>
  );
};
