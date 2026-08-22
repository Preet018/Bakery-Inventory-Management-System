package com.bakery.inventory.service;

import com.bakery.inventory.exception.BadRequestException;
import com.bakery.inventory.exception.StorageException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Set;
import java.util.UUID;

@Service
public class ImageStorageServiceImpl implements ImageStorageService {
    private final Path uploadDirectory;

    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of("image/jpeg", "image/png", "image/webp");

    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024;

    public ImageStorageServiceImpl(@Value("${app.upload.dir:uploads/images/products}") String uploadDir) throws IOException {
        this.uploadDirectory = Paths.get(uploadDir).toAbsolutePath().normalize();

        Files.createDirectories(this.uploadDirectory);
    }

    @Override
    public String storeImage(MultipartFile file) throws IOException {
        validateImage(file);

        String originalFilename = file.getOriginalFilename();

        String extension = getExtension(originalFilename);

        String generatedFilename = UUID.randomUUID() + extension;

        Path destination = uploadDirectory.resolve(generatedFilename).normalize();

        if (!destination.startsWith(uploadDirectory)) {
            throw new StorageException(
                    "Invalid image file path"
            );
        }

        Files.copy(file.getInputStream(), destination);

        return "/images/products/" + generatedFilename;
    }

    @Override
    public void deleteImage(String imagePath) throws IOException {
        if (imagePath == null || imagePath.isBlank()) {
            return;
        }

        String filename = Paths.get(imagePath).getFileName().toString();

        Path filePath = uploadDirectory.resolve(filename).normalize();

        if (!filePath.startsWith(uploadDirectory)) {
            throw new StorageException(
                    "Invalid image file path"
            );
        }

        Files.deleteIfExists(filePath);
    }

    private void validateImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException(
                    "Image file cannot be empty"
            );
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new BadRequestException(
                    "Image file size cannot exceed 5 MB"
            );
        }

        String contentType = file.getContentType();

        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType)) {
            throw new BadRequestException(
                    "Only JPEG, PNG and WebP images are allowed"
            );
        }

        String originalFilename = file.getOriginalFilename();

        if (originalFilename == null || originalFilename.isBlank()) {
            throw new BadRequestException(
                    "Image filename cannot be empty"
            );
        }
    }

    private String getExtension(String filename) {
        int lastDot = filename.lastIndexOf('.');

        if (lastDot == -1) {
            throw new BadRequestException(
                    "Image file must have an extension"
            );
        }

        String extension = filename.substring(lastDot).toLowerCase();

        if (!extension.equals(".jpg") && !extension.equals(".jpeg") && !extension.equals(".png") && !extension.equals(".webp")) {
            throw new BadRequestException(
                    "Unsupported image format"
            );
        }

        return extension;
    }
}