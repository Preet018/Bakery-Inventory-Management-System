package com.bakery.inventory.security;

import com.bakery.inventory.entity.UserAccount;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

@RequiredArgsConstructor
public class CustomUserDetails implements UserDetails {
    private final UserAccount userAccount;

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(
                new SimpleGrantedAuthority(
                        "ROLE_" + userAccount.getRole().getName()
                )
        );
    }

    public Integer getUserId() {
        return userAccount.getId();
    }

    public String getRoleName() {
        return userAccount.getRole().getName();
    }

    @Override
    public String getPassword() {
        return userAccount.getPasswordHash();
    }

    @Override
    public String getUsername() {
        return userAccount.getUsername();
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
        return userAccount.isActive() && userAccount.isEmailVerified();
    }
}