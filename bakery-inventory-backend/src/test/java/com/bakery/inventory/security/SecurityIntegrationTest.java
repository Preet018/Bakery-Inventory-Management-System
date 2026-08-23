package com.bakery.inventory.security;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class SecurityIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void publicProductEndpoint_shouldBeAccessible() throws Exception {
        mockMvc.perform(
                get("/api/products")
        ).andExpect(
                status().isOk()
        );
    }

    @Test
    void inventoryEndpoint_shouldReturn401_whenUnauthenticated()
            throws Exception {

        mockMvc.perform(
                get("/api/inventory")
        ).andExpect(
                status().isUnauthorized()
        );
    }

    @Test
    @WithMockUser(roles = "CUSTOMER")
    void inventoryEndpoint_shouldReturn403_forCustomer()
            throws Exception {

        mockMvc.perform(
                get("/api/inventory")
        ).andExpect(
                status().isForbidden()
        );
    }

    @Test
    void login_shouldReturn400_whenRequestIsInvalid()
            throws Exception {

        mockMvc.perform(
                post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                    "usernameOrEmail": "",
                                    "password": ""
                                }
                                """)
        ).andExpect(
                status().isBadRequest()
        );
    }
}