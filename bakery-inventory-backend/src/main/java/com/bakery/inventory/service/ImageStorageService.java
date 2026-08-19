package com.bakery.inventory.service;

import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

public interface ImageStorageService {
    String storeImage(MultipartFile file) throws IOException;

    void deleteImage(String imagePath) throws IOException;
}