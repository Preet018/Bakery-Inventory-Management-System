package com.bakery.inventory.config;

import com.bakery.inventory.entity.Role;
import com.bakery.inventory.entity.UserAccount;
import com.bakery.inventory.repository.RoleRepository;
import com.bakery.inventory.repository.UserAccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class AdminAccountInitializer implements CommandLineRunner {
    private final UserAccountRepository userAccountRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.username:}")
    private String adminUsername;

    @Value("${app.admin.email:}")
    private String adminEmail;

    @Value("${app.admin.password:}")
    private String adminPassword;

    @Override
    public void run(String... args) {
        Role adminRole = roleRepository
                .findByName("ADMIN")
                .orElseThrow(() ->
                        new IllegalStateException(
                                "ADMIN role is not configured."
                        )
                );

        List<UserAccount> admins = userAccountRepository.findAllByRole_Name("ADMIN");

        if (admins.size() > 1) {
            throw new IllegalStateException(
                    "Security configuration invalid: more than one ADMIN account exists."
            );
        }

        if (admins.size() == 1) {
            UserAccount admin = admins.getFirst();

            if (!admin.isActive()) {
                throw new IllegalStateException(
                        "Security configuration invalid: the ADMIN account is inactive."
                );
            }

            return;
        }

        if (adminUsername.isBlank() || adminEmail.isBlank() || adminPassword.isBlank()) {
            throw new IllegalStateException(
                    "No ADMIN account exists. Set ADMIN_USERNAME, ADMIN_EMAIL and ADMIN_PASSWORD."
            );
        }

        if (userAccountRepository.findByUsername(adminUsername.trim()).isPresent()) {
            throw new IllegalStateException(
                    "Configured ADMIN username already belongs to another account."
            );
        }

        if (userAccountRepository.findByEmail(adminEmail.trim().toLowerCase()).isPresent()) {
            throw new IllegalStateException(
                    "Configured ADMIN email already belongs to another account."
            );
        }

        UserAccount admin = new UserAccount();

        admin.setUsername(adminUsername.trim());
        admin.setPasswordHash(passwordEncoder.encode(adminPassword));

        admin.setEmail(adminEmail.trim().toLowerCase());
        admin.setEmailVerified(true);

        admin.setActive(true);
        admin.setRole(adminRole);

        userAccountRepository.save(admin);
    }
}