package com.apsusm.service;

import com.apsusm.dto.MemberResponse;
import com.apsusm.dto.RegistrationRequest;
import com.apsusm.model.Member;
import com.apsusm.model.MemberStatus;
import com.apsusm.repository.MemberRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class MemberService {

    private static final Logger log = LoggerFactory.getLogger(MemberService.class);

    private final MemberRepository memberRepository;
    private final FileStorageService fileStorageService;
    private final PaystackService paystackService;
    private final MemberIdGenerator memberIdGenerator;
    private final CardGenerationService cardGenerationService;
    private final EmailService emailService;

    public MemberService(MemberRepository memberRepository,
                         FileStorageService fileStorageService,
                         PaystackService paystackService,
                         MemberIdGenerator memberIdGenerator,
                         CardGenerationService cardGenerationService,
                         EmailService emailService) {
        this.memberRepository = memberRepository;
        this.fileStorageService = fileStorageService;
        this.paystackService = paystackService;
        this.memberIdGenerator = memberIdGenerator;
        this.cardGenerationService = cardGenerationService;
        this.emailService = emailService;
    }

    /**
     * Step 1: Register a new member and store photo.
     * Returns the saved member entity.
     */
    @Transactional
    public Member registerMember(RegistrationRequest request, MultipartFile photo) throws Exception {
        String resolvedLicenseNumber = request.getLicenseNumber() != null
                ? request.getLicenseNumber().trim()
                : "";
        if (resolvedLicenseNumber.isBlank()) {
            resolvedLicenseNumber = request.getEmail();
            request.setLicenseNumber(resolvedLicenseNumber);
        }

        // Validate uniqueness
        if (memberRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email is already registered");
        }
        if (memberRepository.existsByLicenseNumber(resolvedLicenseNumber)) {
            throw new IllegalArgumentException("License number is already registered");
        }

        // Store photo
        String photoPath = fileStorageService.storePhoto(photo);

        // Create member
        Member member = new Member();
        member.setFirstName(request.getFirstName());
        member.setLastName(request.getLastName());
        member.setEmail(request.getEmail());
        member.setPhone(request.getPhone());
        member.setLicenseNumber(resolvedLicenseNumber);
        member.setInstitution(request.getInstitution());
        member.setSpecialization(request.getSpecialization());
        member.setProvince(request.getProvince());
        member.setPhotoPath(photoPath);
        member.setMemberId(memberIdGenerator.generateMemberId());
        member.setStatus(MemberStatus.PAID);
        member.setPaidAt(LocalDateTime.now());
        member.setExpiresAt(LocalDateTime.now().plusYears(1));

        member = memberRepository.save(member);
        log.info("Member registered without payment: {} (ID: {}, Member ID: {})", member.getEmail(), member.getId(), member.getMemberId());

        generateAndSendCard(member);

        member = memberRepository.findById(member.getId()).orElse(member);

        return member;
    }

    /**
     * Step 2: Initialize Paystack payment for a member.
     */
    public Map<String, Object> initializePayment(Long memberId) {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new IllegalArgumentException("Member not found"));

        if (member.getStatus() != MemberStatus.PENDING_PAYMENT &&
            member.getStatus() != MemberStatus.PAYMENT_FAILED) {
            throw new IllegalStateException("Member is not in a payable state. Current status: " + member.getStatus());
        }

        String reference = paystackService.generateReference(memberId);
        member.setPaystackReference(reference);
        memberRepository.save(member);

        Map<String, String> metadata = Map.of(
                "member_id", memberId.toString(),
                "email", member.getEmail(),
                "name", member.getFullName()
        );

        return paystackService.initializeTransaction(member.getEmail(), reference, metadata);
    }

    /**
     * Step 3: Process verified payment (called from webhook or manual verify).
     */
    @Transactional
    public Member processPaymentSuccess(String reference) {
        Member member = memberRepository.findByPaystackReference(reference)
                .orElseThrow(() -> new IllegalArgumentException("No member found for payment reference: " + reference));

        if (member.getStatus() == MemberStatus.PAID ||
            member.getStatus() == MemberStatus.CARD_GENERATED ||
            member.getStatus() == MemberStatus.ACTIVE) {
            log.info("Payment already processed for reference: {}", reference);
            return member;
        }

        // Generate unique member ID
        String memberId = memberIdGenerator.generateMemberId();
        member.setMemberId(memberId);
        member.setStatus(MemberStatus.PAID);
        member.setPaidAt(LocalDateTime.now());
        member.setExpiresAt(LocalDateTime.now().plusYears(1));

        member = memberRepository.save(member);
        log.info("Payment verified for member: {} -> {}", member.getEmail(), memberId);

        // Trigger card generation
        try {
            generateAndSendCard(member);
        } catch (Exception e) {
            log.error("Card generation failed for member: {}", memberId, e);
        }

        return member;
    }

    /**
     * Process payment failure.
     */
    @Transactional
    public void processPaymentFailure(String reference) {
        memberRepository.findByPaystackReference(reference).ifPresent(member -> {
            member.setStatus(MemberStatus.PAYMENT_FAILED);
            memberRepository.save(member);
            log.warn("Payment failed for member: {}", member.getEmail());
        });
    }

    /**
     * Step 4 & 5: Generate card and send confirmation email.
     */
    @Transactional
    public void generateAndSendCard(Member member) throws Exception {
        // Generate card images
        String[] cardPaths = cardGenerationService.generateCard(member);
        member.setCardFrontPath(cardPaths[0]);
        member.setCardBackPath(cardPaths[1]);
        member.setCardGeneratedAt(LocalDateTime.now());
        member.setStatus(MemberStatus.CARD_GENERATED);
        member = memberRepository.save(member);

        // Send confirmation email
        emailService.sendConfirmationEmail(member);
        member.setEmailSent(true);
        member.setStatus(MemberStatus.ACTIVE);
        memberRepository.save(member);

        log.info("Card generated and email sent for member: {}", member.getMemberId());
    }

    /**
     * Verify payment via Paystack API (manual verification endpoint).
     */
    public Member verifyPayment(String reference) {
        Map<String, Object> result = paystackService.verifyTransaction(reference);
        boolean verified = (Boolean) result.getOrDefault("verified", false);

        if (verified) {
            return processPaymentSuccess(reference);
        } else {
            processPaymentFailure(reference);
            throw new IllegalStateException("Payment verification failed for reference: " + reference);
        }
    }

    /**
     * Regenerate card for an existing member (admin action).
     */
    @Transactional
    public Member regenerateCard(Long memberId) throws Exception {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new IllegalArgumentException("Member not found"));

        if (member.getMemberId() == null) {
            throw new IllegalStateException("Member has no assigned member ID. Payment may not be verified.");
        }

        String[] cardPaths = cardGenerationService.generateCard(member);
        member.setCardFrontPath(cardPaths[0]);
        member.setCardBackPath(cardPaths[1]);
        member.setCardGeneratedAt(LocalDateTime.now());
        member = memberRepository.save(member);

        log.info("Card regenerated for member: {}", member.getMemberId());
        return member;
    }

    // ===== Query Methods =====

    public Optional<Member> findById(Long id) {
        return memberRepository.findById(id);
    }

    public Optional<Member> findByMemberId(String memberId) {
        return memberRepository.findByMemberId(memberId);
    }

    public Optional<Member> findByEmail(String email) {
        return memberRepository.findByEmail(email);
    }

    public Optional<Member> findByReference(String reference) {
        return memberRepository.findByPaystackReference(reference);
    }

    public List<MemberResponse> getAllMembers() {
        return memberRepository.findAllByOrderByRegisteredAtDesc().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<MemberResponse> getMembersByStatus(MemberStatus status) {
        return memberRepository.findByStatus(status).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public Map<String, Object> getDashboardStats() {
        return Map.of(
                "totalMembers", memberRepository.count(),
                "pendingPayment", memberRepository.countByStatus(MemberStatus.PENDING_PAYMENT),
                "paid", memberRepository.countByStatus(MemberStatus.PAID),
                "active", memberRepository.countByStatus(MemberStatus.ACTIVE),
                "paymentFailed", memberRepository.countByStatus(MemberStatus.PAYMENT_FAILED),
                "cardGenerated", memberRepository.countByStatus(MemberStatus.CARD_GENERATED)
        );
    }

    public MemberResponse toResponse(Member member) {
        MemberResponse resp = new MemberResponse();
        resp.setId(member.getId());
        resp.setMemberId(member.getMemberId());
        resp.setFirstName(member.getFirstName());
        resp.setLastName(member.getLastName());
        resp.setFullName(member.getFullName());
        resp.setEmail(member.getEmail());
        resp.setPhone(member.getPhone());
        resp.setLicenseNumber(member.getLicenseNumber());
        resp.setInstitution(member.getInstitution());
        resp.setSpecialization(member.getSpecialization());
        resp.setProvince(member.getProvince());
        resp.setStatus(member.getStatus());
        resp.setRegisteredAt(member.getRegisteredAt());
        resp.setPaidAt(member.getPaidAt());
        resp.setCardGeneratedAt(member.getCardGeneratedAt());
        resp.setExpiresAt(member.getExpiresAt());
        resp.setEmailSent(member.isEmailSent());
        resp.setHasCard(member.getCardFrontPath() != null);
        return resp;
    }
}
