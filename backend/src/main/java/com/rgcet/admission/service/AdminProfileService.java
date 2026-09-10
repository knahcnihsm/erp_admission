package com.rgcet.admission.service;

import com.rgcet.admission.dto.AdminProfileDto;
import com.rgcet.admission.dto.UpdateAdminProfileRequest;
import com.rgcet.admission.entity.AdminProfile;
import com.rgcet.admission.repository.AdminProfileRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminProfileService {

    private final AdminProfileRepository profileRepository;

    public AdminProfileService(AdminProfileRepository profileRepository) {
        this.profileRepository = profileRepository;
    }

    @Transactional(readOnly = true)
    public AdminProfileDto getProfile() {
        AdminProfile profile = getOrCreateDefaultProfile();
        return new AdminProfileDto(profile.getId(), profile.getAdminName(), profile.getUsername(), profile.getRole());
    }

    @Transactional
    public AdminProfileDto updateProfile(UpdateAdminProfileRequest request) {
        AdminProfile profile = getOrCreateDefaultProfile();

        if (request.getAdminName() != null && !request.getAdminName().trim().isEmpty()) {
            profile.setAdminName(request.getAdminName().trim());
        }

        if (request.getUsername() != null && !request.getUsername().trim().isEmpty()) {
            profile.setUsername(request.getUsername().trim());
        }

        if (request.getNewPassword() != null && !request.getNewPassword().trim().isEmpty()) {
            if (request.getCurrentPassword() == null || !request.getCurrentPassword().equals(profile.getPassword())) {
                throw new IllegalArgumentException("Current password is incorrect");
            }
            profile.setPassword(request.getNewPassword().trim());
        }

        AdminProfile saved = profileRepository.save(profile);
        return new AdminProfileDto(saved.getId(), saved.getAdminName(), saved.getUsername(), saved.getRole());
    }

    @Transactional
    public AdminProfile getOrCreateDefaultProfile() {
        return profileRepository.findTopByOrderByIdAsc().orElseGet(() -> {
            AdminProfile newProfile = new AdminProfile();
            newProfile.setAdminName("Admin User");
            newProfile.setUsername("admin");
            newProfile.setPassword("admin123");
            newProfile.setRole("Administrator");
            return profileRepository.save(newProfile);
        });
    }
}
