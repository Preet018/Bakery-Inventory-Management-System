package com.bakery.inventory.security;

import com.bakery.inventory.entity.UserAccount;
import com.bakery.inventory.repository.UserAccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsServiceImpl implements UserDetailsService {
    private final UserAccountRepository userAccountRepository;

    @Override
    public UserDetails loadUserByUsername(String username)
            throws UsernameNotFoundException {

        UserAccount userAccount = userAccountRepository
                        .findByUsername(username)
                        .or(() -> userAccountRepository.findByEmail(username))
                        .orElseThrow(() ->
                                new UsernameNotFoundException(
                                        "Invalid username or email"
                                )
                        );

        return new CustomUserDetails(userAccount);
    }
}