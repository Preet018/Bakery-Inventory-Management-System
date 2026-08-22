package com.bakery.inventory.dto.useraccount;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserAccountResponse {
    private Integer id;
    private String username;
    private String email;
    private Integer roleId;
}