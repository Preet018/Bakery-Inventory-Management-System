package com.bakery.inventory.controller;

import com.bakery.inventory.dto.savedaddress.SavedAddressCreateRequest;
import com.bakery.inventory.dto.savedaddress.SavedAddressResponse;
import com.bakery.inventory.dto.savedaddress.SavedAddressUpdateRequest;
import com.bakery.inventory.entity.Role;
import com.bakery.inventory.entity.UserAccount;
import com.bakery.inventory.security.CustomUserDetails;
import com.bakery.inventory.service.SavedAddressService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SavedAddressControllerTest {

    @Mock
    private SavedAddressService savedAddressService;

    @Mock
    private Authentication authentication;

    @InjectMocks
    private SavedAddressController savedAddressController;

    private CustomUserDetails customUserDetails;

    @BeforeEach
    void setUp() {
        Role role = new Role();
        role.setId(1);
        role.setName("ROLE_CUSTOMER");

        UserAccount user = new UserAccount();
        user.setId(42);
        user.setUsername("customer");
        user.setEmail("customer@test.com");
        user.setRole(role);

        customUserDetails = new CustomUserDetails(user);
    }

    @Test
    void getUserAddresses_shouldReturnListOfAddresses() {
        when(authentication.getPrincipal()).thenReturn(customUserDetails);
        SavedAddressResponse addressResponse = new SavedAddressResponse();
        addressResponse.setId(1);
        addressResponse.setLabel("Home");

        when(savedAddressService.getUserAddresses(42)).thenReturn(List.of(addressResponse));

        ResponseEntity<List<SavedAddressResponse>> response = savedAddressController.getUserAddresses(authentication);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(1, response.getBody().size());
        assertEquals("Home", response.getBody().get(0).getLabel());
        verify(savedAddressService).getUserAddresses(42);
    }

    @Test
    void getAddress_shouldReturnSingleAddress() {
        when(authentication.getPrincipal()).thenReturn(customUserDetails);
        SavedAddressResponse addressResponse = new SavedAddressResponse();
        addressResponse.setId(10);
        addressResponse.setLabel("Work");

        when(savedAddressService.getAddress(42, 10)).thenReturn(addressResponse);

        ResponseEntity<SavedAddressResponse> response = savedAddressController.getAddress(authentication, 10);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(10, response.getBody().getId());
        verify(savedAddressService).getAddress(42, 10);
    }

    @Test
    void createAddress_shouldReturnCreatedStatus() {
        when(authentication.getPrincipal()).thenReturn(customUserDetails);
        SavedAddressCreateRequest request = new SavedAddressCreateRequest(
                "Home",
                "123 Bakery Lane",
                "Near Oven",
                "Mumbai",
                "Maharashtra",
                "400001",
                new BigDecimal("19.0760"),
                new BigDecimal("72.8777"),
                "place_123",
                true
        );

        SavedAddressResponse createdResponse = new SavedAddressResponse();
        createdResponse.setId(100);
        createdResponse.setLabel("Home");
        createdResponse.setIsDefault(true);

        when(savedAddressService.createAddress(42, request)).thenReturn(createdResponse);

        ResponseEntity<SavedAddressResponse> response = savedAddressController.createAddress(authentication, request);

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(100, response.getBody().getId());
        assertTrue(response.getBody().getIsDefault());
        verify(savedAddressService).createAddress(42, request);
    }

    @Test
    void updateAddress_shouldReturnUpdatedAddress() {
        when(authentication.getPrincipal()).thenReturn(customUserDetails);
        SavedAddressUpdateRequest request = new SavedAddressUpdateRequest(
                "Work Updated",
                "456 Tech Park",
                "Tower B",
                "Pune",
                "Maharashtra",
                "411001",
                new BigDecimal("18.5204"),
                new BigDecimal("73.8567"),
                "place_456"
        );

        SavedAddressResponse updatedResponse = new SavedAddressResponse();
        updatedResponse.setId(20);
        updatedResponse.setLabel("Work Updated");

        when(savedAddressService.updateAddress(42, 20, request)).thenReturn(updatedResponse);

        ResponseEntity<SavedAddressResponse> response = savedAddressController.updateAddress(authentication, 20, request);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("Work Updated", response.getBody().getLabel());
        verify(savedAddressService).updateAddress(42, 20, request);
    }

    @Test
    void deleteAddress_shouldReturnNoContent() {
        when(authentication.getPrincipal()).thenReturn(customUserDetails);

        ResponseEntity<Void> response = savedAddressController.deleteAddress(authentication, 30);

        assertEquals(HttpStatus.NO_CONTENT, response.getStatusCode());
        verify(savedAddressService).deleteAddress(42, 30);
    }

    @Test
    void setDefaultAddress_shouldReturnUpdatedDefaultAddress() {
        when(authentication.getPrincipal()).thenReturn(customUserDetails);
        SavedAddressResponse defaultResponse = new SavedAddressResponse();
        defaultResponse.setId(15);
        defaultResponse.setIsDefault(true);

        when(savedAddressService.setDefaultAddress(42, 15)).thenReturn(defaultResponse);

        ResponseEntity<SavedAddressResponse> response = savedAddressController.setDefaultAddress(authentication, 15);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().getIsDefault());
        verify(savedAddressService).setDefaultAddress(42, 15);
    }
}
