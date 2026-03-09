package com.apsusm.controller;

import com.apsusm.dto.PaymentInitResponse;
import com.apsusm.dto.RegistrationRequest;
import com.apsusm.model.Member;
import com.apsusm.service.MemberService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/members")
public class RegistrationController {

    private static final Logger log = LoggerFactory.getLogger(RegistrationController.class);
    private final MemberService memberService;

    public RegistrationController(MemberService memberService) {
        this.memberService = memberService;
    }

    /**
     * POST /api/members/register
     * Register a new member with photo upload.
     * Accepts multipart form data.
     */
    @PostMapping(value = "/register", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> register(
            @RequestParam(value = "fullName", required = false) String fullName,
            @RequestParam(value = "firstName", required = false) String firstName,
            @RequestParam(value = "lastName", required = false) String lastName,
            @RequestParam("email") String email,
            @RequestParam(value = "phone", required = false) String phone,
            @RequestParam(value = "licenseNumber", required = false) String licenseNumber,
            @RequestParam(value = "institution", required = false) String institution,
            @RequestParam(value = "position", required = false) String position,
            @RequestParam(value = "specialization", required = false) String specialization,
            @RequestParam("province") String province,
            @RequestParam("photo") MultipartFile photo) {

        try {
            String resolvedFirstName = firstName != null ? firstName.trim() : "";
            String resolvedLastName = lastName != null ? lastName.trim() : "";
            String resolvedLicenseNumber = licenseNumber != null ? licenseNumber.trim() : "";
            if ((resolvedFirstName.isBlank() || resolvedLastName.isBlank()) && fullName != null) {
                String[] parts = fullName.trim().split("\\s+", 2);
                if (resolvedFirstName.isBlank() && parts.length > 0) {
                    resolvedFirstName = parts[0];
                }
                if (resolvedLastName.isBlank()) {
                    resolvedLastName = parts.length > 1 ? parts[1] : "Member";
                }
            }

            RegistrationRequest request = new RegistrationRequest();
            request.setFirstName(resolvedFirstName);
            request.setLastName(resolvedLastName);
            request.setEmail(email);
            request.setPhone(phone);
            request.setLicenseNumber(!resolvedLicenseNumber.isBlank() ? resolvedLicenseNumber : email);
            request.setInstitution(institution);
            request.setSpecialization(
                    specialization != null && !specialization.isBlank() ? specialization : position
            );
            request.setProvince(province);

            Member member = memberService.registerMember(request, photo);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Registration successful.",
                    "memberId", member.getId(),
                    "member", memberService.toResponse(member)
            ));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        } catch (Exception e) {
            log.error("Registration failed", e);
            return ResponseEntity.internalServerError().body(Map.of(
                    "success", false,
                    "message", "Registration failed. Please try again."
            ));
        }
    }

    /**
     * POST /api/members/{id}/pay
     * Initialize Paystack payment for a registered member.
     */
    @PostMapping("/{id}/pay")
    public ResponseEntity<?> initializePayment(@PathVariable Long id) {
        try {
            Map<String, Object> result = memberService.initializePayment(id);
            boolean success = (Boolean) result.getOrDefault("success", false);

            if (success) {
                return ResponseEntity.ok(new PaymentInitResponse(
                        true,
                        (String) result.get("authorization_url"),
                        (String) result.get("reference"),
                        "Payment initialized"
                ));
            } else {
                return ResponseEntity.badRequest().body(new PaymentInitResponse(
                        false, null, null,
                        (String) result.getOrDefault("message", "Payment initialization failed")
                ));
            }

        } catch (Exception e) {
            log.error("Payment initialization failed for member: {}", id, e);
            return ResponseEntity.badRequest().body(new PaymentInitResponse(
                    false, null, null, e.getMessage()
            ));
        }
    }

    /**
     * GET /api/members/status/{id}
     * Check member registration and payment status.
     */
    @GetMapping("/status/{id}")
    public ResponseEntity<?> getStatus(@PathVariable Long id) {
        return memberService.findById(id)
                .map(member -> ResponseEntity.ok(Map.of(
                        "success", true,
                        "member", memberService.toResponse(member)
                )))
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * GET /api/members/verify/{memberId}
     * Public verification endpoint for a member ID.
     */
    @GetMapping("/verify/{memberId}")
    public ResponseEntity<?> verifyMember(@PathVariable String memberId) {
        return memberService.findByMemberId(memberId)
                .map(member -> ResponseEntity.ok(Map.of(
                        "verified", true,
                        "memberId", member.getMemberId(),
                        "name", member.getFullName(),
                        "specialization", member.getSpecialization() != null ? member.getSpecialization() : "",
                        "province", member.getProvince() != null ? member.getProvince() : "",
                        "status", member.getStatus().name(),
                        "expiresAt", member.getExpiresAt() != null ? member.getExpiresAt().toString() : ""
                )))
                .orElse(ResponseEntity.ok(Map.of(
                        "verified", false,
                        "message", "Member ID not found"
                )));
    }

    /**
     * GET /api/members/card/{id}/front
     * Download the front of the membership card.
     */
    @GetMapping("/card/{id}/front")
    public ResponseEntity<byte[]> getCardFront(@PathVariable Long id) {
        return memberService.findById(id)
                .filter(m -> m.getCardFrontPath() != null)
                .map(member -> {
                    try {
                        byte[] data = java.nio.file.Files.readAllBytes(
                                java.nio.file.Paths.get(member.getCardFrontPath()));
                        return ResponseEntity.ok()
                                .contentType(MediaType.IMAGE_PNG)
                                .header("Content-Disposition",
                                        "inline; filename=" + member.getMemberId() + "_front.png")
                                .body(data);
                    } catch (Exception e) {
                        return ResponseEntity.internalServerError().<byte[]>build();
                    }
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * GET /api/members/card/{id}/back
     * Download the back of the membership card.
     */
    @GetMapping("/card/{id}/back")
    public ResponseEntity<byte[]> getCardBack(@PathVariable Long id) {
        return memberService.findById(id)
                .filter(m -> m.getCardBackPath() != null)
                .map(member -> {
                    try {
                        byte[] data = java.nio.file.Files.readAllBytes(
                                java.nio.file.Paths.get(member.getCardBackPath()));
                        return ResponseEntity.ok()
                                .contentType(MediaType.IMAGE_PNG)
                                .header("Content-Disposition",
                                        "inline; filename=" + member.getMemberId() + "_back.png")
                                .body(data);
                    } catch (Exception e) {
                        return ResponseEntity.internalServerError().<byte[]>build();
                    }
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
