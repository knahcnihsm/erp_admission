package com.rgcet.admission.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Stream;

@Service
public class FileStorageService {

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("pdf", "jpg", "jpeg", "png");

    private static final Map<String, String> CERTIFICATE_SLUGS = Map.ofEntries(
            Map.entry("PROVISIONAL ALLOTMENT ORDER", "provisional_allotment_order"),
            Map.entry("SPECIAL CATEGORY CERTIFICATE", "special_category_certificate"),
            Map.entry("PROVISIONAL CERTIFICATE", "provisional_certificate"),
            Map.entry("UNDERTAKING FORM", "undertaking_form"),
            Map.entry("MARK SHEET", "marksheet"),
            Map.entry("DEGREE CERTIFICATE", "degree_certificate"),
            Map.entry("RESIDENCE CERTIFICATE", "residence_certificate"),
            Map.entry("TRANSFER CERTIFICATE", "transfer_certificate"),
            Map.entry("PROOF OF AGE", "proof_of_age"),
            Map.entry("COMMUNITY CERTIFICATE", "community_certificate"),
            Map.entry("CONDUCT CERTIFICATE", "conduct_certificate"),
            Map.entry("AADHAAR CARD", "aadhaar"));

    private final Path root;

    public FileStorageService(@Value("${app.upload-dir:uploads}") String uploadDir) {
        this.root = Path.of(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(root);
        } catch (IOException e) {
            throw new IllegalStateException("Could not create upload directory: " + root, e);
        }
    }

    /**
     * Stores a certificate file under {root}/{applicationNumber}/{slug}.{ext}
     * and returns the web-accessible path (/uploads/...).
     * Re-uploading the same certificate replaces the previous file.
     */
    public String storeCertificate(String applicationNumber, String certificateName, MultipartFile file) {
        if (applicationNumber == null || applicationNumber.isBlank()) {
            throw new IllegalArgumentException("Application number is required.");
        }
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Uploaded file is empty.");
        }
        String extension = extensionOf(file.getOriginalFilename());
        String slug = slugFor(certificateName);

        Path applicationDir = applicationDir(applicationNumber);
        try {
            Files.createDirectories(applicationDir);
            deleteExisting(applicationDir, slug);
            Path target = applicationDir.resolve(slug + "." + extension).normalize();
            if (!target.startsWith(applicationDir)) {
                throw new IllegalArgumentException("Invalid file path.");
            }
            file.transferTo(target);
        } catch (IOException e) {
            throw new UncheckedIOException("Could not store certificate file: " + slug, e);
        }
        return "/uploads/" + sanitizeApplicationNumber(applicationNumber) + "/" + slug + "." + extension;
    }

    /**
     * Deletes the physical file (if any) belonging to the given certificate for a student.
     * No-op when nothing is stored.
     */
    public void deleteCertificate(String applicationNumber, String certificateName) {
        if (applicationNumber == null || applicationNumber.isBlank()) {
            return;
        }
        try {
            deleteExisting(applicationDir(applicationNumber), slugFor(certificateName));
        } catch (IOException e) {
            throw new UncheckedIOException("Could not delete certificate file.", e);
        }
    }

    private void deleteExisting(Path studentDir, String slug) throws IOException {
        if (!Files.isDirectory(studentDir)) {
            return;
        }
        try (Stream<Path> paths = Files.list(studentDir)) {
            List<Path> stale = paths
                    .filter(p -> matchesSlug(p.getFileName().toString(), slug))
                    .toList();
            for (Path p : stale) {
                Files.deleteIfExists(p);
            }
        }
    }

    private boolean matchesSlug(String fileName, String slug) {
        String lower = fileName.toLowerCase(Locale.ROOT);
        if (!lower.startsWith(slug + ".")) {
            return false;
        }
        String ext = lower.substring(lower.lastIndexOf('.') + 1);
        return ALLOWED_EXTENSIONS.contains(ext);
    }

    private Path applicationDir(String applicationNumber) {
        return root.resolve(sanitizeApplicationNumber(applicationNumber)).normalize();
    }

    /**
     * Makes an application number safe to use as a folder name while staying
     * human-readable. e.g. "RGCET/2026/2013" -> "RGCET-2026-2013".
     */
    public String sanitizeApplicationNumber(String applicationNumber) {
        if (applicationNumber == null || applicationNumber.isBlank()) {
            return "unknown";
        }
        String sanitized = applicationNumber.trim()
                .replaceAll("[^A-Za-z0-9._-]+", "-")
                .replaceAll("^-+|-+$", "");
        return sanitized.isEmpty() ? "unknown" : sanitized;
    }

    private String extensionOf(String originalName) {
        if (originalName == null || originalName.lastIndexOf('.') < 0) {
            throw new IllegalArgumentException("File must be a PDF, JPG, JPEG or PNG.");
        }
        String ext = originalName.substring(originalName.lastIndexOf('.') + 1).toLowerCase(Locale.ROOT);
        if (!ALLOWED_EXTENSIONS.contains(ext)) {
            throw new IllegalArgumentException("Only PDF, JPG, JPEG and PNG files are allowed.");
        }
        return ext;
    }

    public String slugFor(String certificateName) {
        if (certificateName == null) {
            throw new IllegalArgumentException("Certificate name is required.");
        }
        String key = certificateName.trim().toUpperCase(Locale.ROOT);
        String mapped = CERTIFICATE_SLUGS.get(key);
        if (mapped != null) {
            return mapped;
        }
        String slug = key.toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "_")
                .replaceAll("^_+|_+$", "");
        return slug.isEmpty() ? "certificate" : slug;
    }
}
