// CHANGE: This helper keeps role handling consistent throughout
// the frontend application.

/**
 * Convert different backend role formats into one canonical format.
 *
 * Examples:
 *
 * ROLE_CUSTOMER       -> CUSTOMER
 * CUSTOMER            -> CUSTOMER
 * ROLE_ADMIN          -> ADMIN
 * ADMIN               -> ADMIN
 * ROLE_INVENTORY_MANAGER -> INVENTORY_MANAGER
 */
export const normalizeRole = (role) => {
    if (!role) {
        return null;
    }

    const normalized = role
        .replace(/^ROLE_/, '')
        .toUpperCase();

    return normalized;
};

/**
 * CHANGE: All roles land on the public home page (/) after login.
 */
export const getRoleHome = () => {
    return '/';
};

/**
 * CHANGE: Check whether a user's role is allowed to access
 * a particular protected route.
 *
 * Example:
 *
 * hasAllowedRole('CUSTOMER', ['CUSTOMER'])
 * -> true
 *
 * hasAllowedRole('CUSTOMER', ['ADMIN'])
 * -> false
 */
export const hasAllowedRole = (userRole, allowedRoles = []) => {
    const normalizedUserRole = normalizeRole(userRole);

    return allowedRoles.some(
        (allowedRole) =>
            normalizeRole(allowedRole) === normalizedUserRole
    );
};

/**
 * CHANGE: Parse JWT payload to extract claims such as userId without external libraries.
 * Properly adds Base64URL padding so atob() never fails on unpadded strings.
 */
export const parseJwt = (token) => {
    try {
        if (!token || typeof token !== 'string') return null;
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        while (base64.length % 4 !== 0) {
            base64 += '=';
        }
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
        return JSON.parse(jsonPayload);
    } catch (e) {
        console.warn('Failed to parse JWT:', e);
        return null;
    }
};