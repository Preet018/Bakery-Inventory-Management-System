package com.bakery.inventory.dto.useraccount;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserAccountRequest {

    private String username;
    private String password;
    private String email;
    private String address;
    private Integer roleId;
}