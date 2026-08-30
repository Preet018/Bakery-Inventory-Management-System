package com.bakery.inventory;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

// CHANGE: Enabled Spring async execution for non-blocking email delivery
@SpringBootApplication
@org.springframework.scheduling.annotation.EnableAsync
@org.springframework.scheduling.annotation.EnableScheduling
public class BakeryInventoryManagementApplication {

	public static void main(String[] args) {
		SpringApplication.run(BakeryInventoryManagementApplication.class, args);
	}

}
