package com.bakery.inventory.security;

import com.bakery.inventory.entity.UserAccount;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

public class CustomUserDetails implements UserDetails {
    private final Integer userId;
    private final String username;
    private final String password;
    private final String roleName;
    private final boolean active;
    private final boolean emailVerified;
    private final Collection<? extends GrantedAuthority> authorities;

    public CustomUserDetails(UserAccount userAccount) {
        this.userId = userAccount.getId();
        this.username = userAccount.getUsername();
        this.password = userAccount.getPasswordHash();
        this.roleName = userAccount.getRole() != null ? userAccount.getRole().getName() : "CUSTOMER";
        this.active = userAccount.isActive();
        this.emailVerified = userAccount.isEmailVerified();
        this.authorities = List.of(
                new SimpleGrantedAuthority("ROLE_" + this.roleName)
        );
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return this.authorities;
    }

    public Integer getUserId() {
        return this.userId;
    }

    public String getRoleName() {
        return this.roleName;
    }

    @Override
    public String getPassword() {
        return this.password;
    }

    @Override
    public String getUsername() {
        return this.username;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return this.active;
    }

    public boolean isEmailVerified() {
        return this.emailVerified;
    }
}