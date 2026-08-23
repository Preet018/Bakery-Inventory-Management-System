package com.bakery.inventory.security;

import com.bakery.inventory.entity.Role;
import com.bakery.inventory.entity.UserAccount;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class CustomUserDetailsTest {

    private UserAccount createUser(
            boolean active,
            String roleName
    ) {
        Role role = new Role();
        role.setId(1);
        role.setName(roleName);

        UserAccount user =
                new UserAccount();

        user.setId(10);
        user.setUsername("customer");
        user.setPasswordHash("encoded-password");
        user.setRole(role);
        user.setActive(active);
        user.setEmailVerified(true);

        return user;
    }

    @Test
    void getAuthorities_shouldReturnRoleWithRolePrefix() {
        CustomUserDetails details =
                new CustomUserDetails(
                        createUser(
                                true,
                                "CUSTOMER"
                        )
                );

        assertEquals(
                "ROLE_CUSTOMER",
                details.getAuthorities()
                        .iterator()
                        .next()
                        .getAuthority()
        );
    }

    @Test
    void isEnabled_shouldReflectAccountStatus() {
        CustomUserDetails activeUser =
                new CustomUserDetails(
                        createUser(
                                true,
                                "CUSTOMER"
                        )
                );

        CustomUserDetails inactiveUser =
                new CustomUserDetails(
                        createUser(
                                false,
                                "CUSTOMER"
                        )
                );

        assertTrue(activeUser.isEnabled());
        assertFalse(inactiveUser.isEnabled());
    }

    @Test
    void getUserDetails_shouldExposeUserInformation() {
        CustomUserDetails details =
                new CustomUserDetails(
                        createUser(
                                true,
                                "INVENTORY_MANAGER"
                        )
                );

        assertEquals(
                10,
                details.getUserId()
        );

        assertEquals(
                "customer",
                details.getUsername()
        );

        assertEquals(
                "encoded-password",
                details.getPassword()
        );

        assertEquals(
                "INVENTORY_MANAGER",
                details.getRoleName()
        );

        assertTrue(details.isEmailVerified());
    }
}