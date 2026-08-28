package com.rgcet.admission.controller;

import com.rgcet.admission.service.CertificateService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/certificates")
@RequiredArgsConstructor
public class CertificateController {

    private final CertificateService certificateService;

    @PostMapping("/upload")
    public Map<String, String> upload(@RequestParam Long studentId,
                                      @RequestParam Long certificateId,
                                      @RequestParam("file") MultipartFile file) {
        String filePath = certificateService.upload(studentId, certificateId, file);
        return Map.of("filePath", filePath);
    }

    @DeleteMapping("/{studentId}/{certificateId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long studentId, @PathVariable Long certificateId) {
        certificateService.delete(studentId, certificateId);
    }
}
