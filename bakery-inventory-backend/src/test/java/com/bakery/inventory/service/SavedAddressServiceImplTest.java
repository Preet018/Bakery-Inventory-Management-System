package com.bakery.inventory.service;

import com.bakery.inventory.dto.savedaddress.SavedAddressCreateRequest;
import com.bakery.inventory.entity.SavedAddress;
import com.bakery.inventory.entity.UserAccount;
import com.bakery.inventory.repository.SavedAddressRepository;
import com.bakery.inventory.repository.UserAccountRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SavedAddressServiceImplTest {

    @Mock
    private SavedAddressRepository savedAddressRepository;

    @Mock
    private UserAccountRepository userAccountRepository;

    @InjectMocks
    private SavedAddressServiceImpl savedAddressService;

    private UserAccount createUser() {
        UserAccount user =
                new UserAccount();

        user.setId(1);
        user.setUsername("customer");
        user.setEmail("customer@test.com");

        return user;
    }

    private SavedAddressCreateRequest createRequest(
            boolean isDefault
    ) {
        return new SavedAddressCreateRequest(
                "Home",
                "123 Main Street",
                "Near Bakery",
                "Bangalore",
                "Karnataka",
                "560001",
                new BigDecimal("12.97160000"),
                new BigDecimal("77.59460000"),
                "place-id",
                isDefault
        );
    }

    @Test
    void createAddress_shouldMakeFirstAddressDefault() {
        UserAccount user = createUser();

        when(userAccountRepository.findById(1))
                .thenReturn(Optional.of(user));

        when(savedAddressRepository.existsByUserId(1))
                .thenReturn(false);

        when(savedAddressRepository
                .findByUserIdAndIsDefaultTrue(1))
                .thenReturn(List.of());

        when(savedAddressRepository.save(any(SavedAddress.class)))
                .thenAnswer(invocation ->
                        invocation.getArgument(0));

        var response =
                savedAddressService.createAddress(
                        1,
                        createRequest(false)
                );

        assertTrue(response.getIsDefault());

        verify(savedAddressRepository)
                .save(any(SavedAddress.class));
    }

    @Test
    void setDefaultAddress_shouldClearExistingDefault() {
        UserAccount user = createUser();

        SavedAddress oldDefault =
                new SavedAddress();

        oldDefault.setId(10);
        oldDefault.setUser(user);
        oldDefault.setIsDefault(true);

        SavedAddress newDefault =
                new SavedAddress();

        newDefault.setId(11);
        newDefault.setUser(user);
        newDefault.setIsDefault(false);

        when(savedAddressRepository
                .findByIdAndUserId(11, 1))
                .thenReturn(Optional.of(newDefault));

        when(savedAddressRepository
                .findByUserIdAndIsDefaultTrue(1))
                .thenReturn(List.of(oldDefault));

        when(savedAddressRepository.save(newDefault))
                .thenReturn(newDefault);

        var response =
                savedAddressService.setDefaultAddress(
                        1,
                        11
                );

        assertFalse(oldDefault.getIsDefault());
        assertTrue(newDefault.getIsDefault());
        assertTrue(response.getIsDefault());

        verify(savedAddressRepository)
                .save(newDefault);
    }
}