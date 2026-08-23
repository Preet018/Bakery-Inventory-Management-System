package com.bakery.inventory.config;

import com.bakery.inventory.security.CustomUserDetailsServiceImpl;
import com.bakery.inventory.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {
    private final CustomUserDetailsServiceImpl userDetailsService;

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider(userDetailsService);

        provider.setPasswordEncoder(passwordEncoder());

        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http)
            throws Exception {

        http
                .csrf(csrf -> csrf.disable())

                .sessionManagement(session ->
                        session.sessionCreationPolicy(
                                SessionCreationPolicy.STATELESS
                        )
                )

                .exceptionHandling(exception -> exception
                        .authenticationEntryPoint(
                                new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)
                        )
                )

                .authenticationProvider(
                        authenticationProvider()
                )

                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                "/swagger-ui.html",
                                "/swagger-ui/**",
                                "/v3/api-docs/**"
                        ).permitAll()

                        .requestMatchers(
                                "/api/auth/register",
                                "/api/auth/verify-email",
                                "/api/auth/request-verification",
                                "/api/auth/login"
                        ).permitAll()


                        // Authentication endpoints remain public.
                        .requestMatchers(
                                "/api/auth/register",
                                "/api/auth/verify-email",
                                "/api/auth/request-verification",
                                "/api/auth/login"
                        ).permitAll()

                        // Product/category browsing is public.
                        // Customers should be able to browse the bakery
                        // without logging in.
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/products",
                                "/api/products/**",
                                "/api/categories",
                                "/api/categories/**"
                        ).permitAll()

                        // Category management belongs ONLY to ADMIN.
                        .requestMatchers(
                                "/api/categories/**"
                        ).hasRole("ADMIN")

                        // Product creation/modification is available to
                        // ADMIN and INVENTORY_MANAGER.
                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/products/**"
                        ).hasAnyRole(
                                "ADMIN",
                                "INVENTORY_MANAGER"
                        )

                        .requestMatchers(
                                HttpMethod.PUT,
                                "/api/products/**"
                        ).hasAnyRole(
                                "ADMIN",
                                "INVENTORY_MANAGER"
                        )

                        .requestMatchers(
                                HttpMethod.PATCH,
                                "/api/products/**"
                        ).hasAnyRole(
                                "ADMIN",
                                "INVENTORY_MANAGER"
                        )

                        .requestMatchers(
                                HttpMethod.DELETE,
                                "/api/products/**"
                        ).hasAnyRole(
                                "ADMIN",
                                "INVENTORY_MANAGER"
                        )

                        // Inventory operations:
                        // ADMIN + INVENTORY_MANAGER
                        .requestMatchers(
                                "/api/inventory/**"
                        ).hasAnyRole(
                                "ADMIN",
                                "INVENTORY_MANAGER"
                        )

                        // Suppliers are part of inventory management.
                        // ADMIN + INVENTORY_MANAGER
                        .requestMatchers(
                                "/api/suppliers/**"
                        ).hasAnyRole(
                                "ADMIN",
                                "INVENTORY_MANAGER"
                        )

                        // Stock transaction/history is an internal
                        // inventory operation.
                        // ADMIN + INVENTORY_MANAGER
                        .requestMatchers(
                                "/api/stock-transactions/**"
                        ).hasAnyRole(
                                "ADMIN",
                                "INVENTORY_MANAGER"
                        )

                        // Orders:
                        // CUSTOMER can work with orders.
                        // ADMIN can inspect/manage orders.
                        // Order creation and customer order operations.
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/orders"
                        ).hasRole("ADMIN")

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/orders/**")
                        .hasAnyRole(
                                "CUSTOMER",
                                "ADMIN"
                        )

                        .requestMatchers(
                                HttpMethod.PATCH,
                                "/api/orders/*/status"
                        ).hasRole("ADMIN")

                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/orders/*/cancel"
                        ).hasAnyRole(
                                "CUSTOMER",
                                "ADMIN"
                        )

                        // Payments:
                        // CUSTOMER + ADMIN.
                        // Inventory managers do not handle payments.
                        .requestMatchers(
                                "/api/payments/**"
                        ).hasAnyRole(
                                "CUSTOMER",
                                "ADMIN"
                        )

                        // All administrative endpoints require ADMIN.
                        .requestMatchers("/api/admin/**")
                        .hasRole("ADMIN")

                        .anyRequest().authenticated()
                )

                .addFilterBefore(
                        jwtAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class
                );

        return http.build();
    }
}