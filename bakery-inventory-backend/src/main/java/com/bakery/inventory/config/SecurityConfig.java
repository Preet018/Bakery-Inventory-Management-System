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
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {
    private final CustomUserDetailsServiceImpl userDetailsService;

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of("http://localhost:5173", "http://127.0.0.1:5173"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type", "X-Requested-With", "Accept", "Origin", "Access-Control-Request-Method", "Access-Control-Request-Headers"));
        configuration.setExposedHeaders(List.of("Authorization"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

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
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
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

                        // Authentication endpoints remain public.
                        .requestMatchers(
                                "/api/auth/register",
                                "/api/auth/register/**",
                                "/api/auth/verify-registration",
                                "/api/auth/verify-email",
                                "/api/auth/request-verification",
                                "/api/auth/login",
                                "/api/auth/change-password",
                                "/api/auth/password-reset/**" // CHANGE: Added password-reset OTP endpoints to permitAll
                        ).permitAll()

                        // Product/category browsing and static product images are public.
                        // Customers should be able to browse the bakery and view images
                        // without logging in.
                        .requestMatchers(
                                HttpMethod.GET,
                                "/images/**",
                                "/images/products/**",
                                "/api/products",
                                "/api/products/**",
                                "/api/categories",
                                "/api/categories/**"
                        ).permitAll()

                        // Category management belongs ONLY to ADMIN.
                        .requestMatchers(
                                "/api/categories/**"
                        ).hasRole("ADMIN")

                        // Product creation/modification/images belongs ONLY to ADMIN.
                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/products/**"
                        ).hasRole("ADMIN")

                        .requestMatchers(
                                HttpMethod.PUT,
                                "/api/products/**"
                        ).hasRole("ADMIN")

                        .requestMatchers(
                                HttpMethod.PATCH,
                                "/api/products/**"
                        ).hasRole("ADMIN")

                        .requestMatchers(
                                HttpMethod.DELETE,
                                "/api/products/**"
                        ).hasRole("ADMIN")

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
                        // ADMIN + INVENTORY_MANAGER can inspect/manage orders.
                        // Order creation and customer order operations.
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/orders"
                        ).hasAnyRole("ADMIN", "INVENTORY_MANAGER")

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/orders/**")
                        .hasAnyRole(
                                "CUSTOMER",
                                "ADMIN",
                                "INVENTORY_MANAGER"
                        )

                        .requestMatchers(
                                HttpMethod.PATCH,
                                "/api/orders/*/status"
                        ).hasAnyRole(
                                "ADMIN",
                                "INVENTORY_MANAGER"
                        )

                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/orders/*/cancel"
                        ).hasAnyRole(
                                "CUSTOMER",
                                "ADMIN",
                                "INVENTORY_MANAGER"
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

                        // Saved Addresses:
                        // CUSTOMER only.
                        .requestMatchers(
                                "/api/addresses/**"
                        ).hasRole("CUSTOMER")

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