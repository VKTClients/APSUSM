package com.apsusm.service;

import com.apsusm.model.Member;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.qrcode.QRCodeWriter;
import com.google.zxing.common.BitMatrix;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.geom.RoundRectangle2D;
import java.awt.image.BufferedImage;
import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

@Service
public class CardGenerationService {

    private static final Logger log = LoggerFactory.getLogger(CardGenerationService.class);

    // Card dimensions for back card (Java2D)
    private static final int CARD_WIDTH = 1012;
    private static final int CARD_HEIGHT = 638;
    private static final int CORNER_RADIUS = 30;

    // Back card colors
    private static final Color BACK_BG = new Color(245, 245, 250);
    private static final Color BACK_TEXT_DARK = new Color(30, 30, 50);
    private static final Color BACK_TEXT_GRAY = new Color(100, 100, 120);
    private static final Color BACK_BORDER = new Color(220, 220, 230);
    private static final Color BRAND_BLUE = new Color(0, 122, 204);
    private static final Color BRAND_GREEN = new Color(139, 197, 63);
    private static final Color BRAND_PURPLE = new Color(102, 45, 145);

    @Value("${app.cards.dir}")
    private String cardsDir;

    @Value("${app.card-generator.url:http://localhost:5500}")
    private String cardGeneratorUrl;

    /**
     * Generate both front and back of the membership card.
     * Front card: calls Python AI card generation service.
     * Back card: generated locally with Java2D.
     * Returns paths: [frontPath, backPath]
     */
    public String[] generateCard(Member member) throws Exception {
        log.info("Generating card for member: {} (AI mode)", member.getMemberId());

        // Ensure output directory exists
        Files.createDirectories(Paths.get(cardsDir));

        String frontFilename = member.getMemberId().replace("-", "_") + "_front.png";
        String backFilename = member.getMemberId().replace("-", "_") + "_back.png";

        Path frontPath = Paths.get(cardsDir, frontFilename);
        Path backPath = Paths.get(cardsDir, backFilename);

        // Front card: call the Python AI service
        byte[] frontPng = generateFrontCardAI(member);
        Files.write(frontPath, frontPng);
        log.info("AI front card saved: {} ({} bytes)", frontPath, frontPng.length);

        // Back card: still generated locally with Java2D
        BufferedImage backCard = generateBackCard(member);
        ImageIO.write(backCard, "PNG", backPath.toFile());

        log.info("Card generated successfully: {} and {}", frontPath, backPath);
        return new String[]{frontPath.toString(), backPath.toString()};
    }

    // =========================================================================
    // Front card: AI generation via Python Flask API
    // =========================================================================

    /**
     * Call the Python card generator's /api/generate-card-ai endpoint.
     * Sends the member's photo + details as multipart form data.
     * Returns raw PNG bytes of the AI-generated front card.
     */
    private byte[] generateFrontCardAI(Member member) throws Exception {
        String endpoint = cardGeneratorUrl + "/api/generate-card-ai";
        log.info("Calling AI card generator: {}", endpoint);

        String boundary = "----CardGenBoundary" + System.currentTimeMillis();

        URL url = new URL(endpoint);
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("POST");
        conn.setDoOutput(true);
        conn.setConnectTimeout(30_000);
        conn.setReadTimeout(120_000); // AI generation can take time
        conn.setRequestProperty("Content-Type", "multipart/form-data; boundary=" + boundary);

        try (OutputStream os = conn.getOutputStream()) {
            // full_name
            writeFormField(os, boundary, "full_name", member.getFullName());

            // member_id
            writeFormField(os, boundary, "member_id", member.getMemberId());
            writeFormField(os, boundary, "user_id", String.valueOf(member.getId()));

            // photo file
            if (member.getPhotoPath() != null) {
                File photoFile = new File(member.getPhotoPath());
                if (photoFile.exists()) {
                    writeFileField(os, boundary, "photo", photoFile);
                } else {
                    log.warn("Photo file not found: {}, sending placeholder", member.getPhotoPath());
                    throw new FileNotFoundException("Member photo not found: " + member.getPhotoPath());
                }
            } else {
                throw new IllegalStateException("Member has no photo path set");
            }

            // Close multipart
            os.write(("--" + boundary + "--\r\n").getBytes());
            os.flush();
        }

        int responseCode = conn.getResponseCode();
        if (responseCode == 200) {
            try (InputStream is = conn.getInputStream()) {
                return is.readAllBytes();
            }
        } else {
            String errorBody;
            try (InputStream es = conn.getErrorStream()) {
                errorBody = es != null ? new String(es.readAllBytes()) : "No error body";
            }
            log.error("AI card generation failed (HTTP {}): {}", responseCode, errorBody);
            throw new RuntimeException("AI card generation failed (HTTP " + responseCode + "): " + errorBody);
        }
    }

    private void writeFormField(OutputStream os, String boundary, String name, String value) throws IOException {
        os.write(("--" + boundary + "\r\n").getBytes());
        os.write(("Content-Disposition: form-data; name=\"" + name + "\"\r\n").getBytes());
        os.write("\r\n".getBytes());
        os.write((value != null ? value : "").getBytes("UTF-8"));
        os.write("\r\n".getBytes());
    }

    private void writeFileField(OutputStream os, String boundary, String fieldName, File file) throws IOException {
        String filename = file.getName();
        String mimeType = filename.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg";

        os.write(("--" + boundary + "\r\n").getBytes());
        os.write(("Content-Disposition: form-data; name=\"" + fieldName + "\"; filename=\"" + filename + "\"\r\n").getBytes());
        os.write(("Content-Type: " + mimeType + "\r\n").getBytes());
        os.write("\r\n".getBytes());

        try (FileInputStream fis = new FileInputStream(file)) {
            byte[] buffer = new byte[8192];
            int len;
            while ((len = fis.read(buffer)) != -1) {
                os.write(buffer, 0, len);
            }
        }
        os.write("\r\n".getBytes());
    }

    // =========================================================================
    // Back card: Java2D (kept as-is)
    // =========================================================================

    private BufferedImage generateBackCard(Member member) throws Exception {
        BufferedImage card = new BufferedImage(CARD_WIDTH, CARD_HEIGHT, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g = card.createGraphics();
        enableAntialiasing(g);

        // White/light background
        drawRoundedRect(g, 0, 0, CARD_WIDTH, CARD_HEIGHT, CORNER_RADIUS, BACK_BG);

        // Top accent bar
        GradientPaint topGradient = new GradientPaint(0, 0, BRAND_PURPLE, CARD_WIDTH, 0, BRAND_BLUE);
        g.setPaint(topGradient);
        g.fillRect(0, 0, CARD_WIDTH, 6);

        // QR Code (left side)
        BufferedImage qrCode = generateQRCode(
                "https://apsusm.org/verify/" + member.getMemberId(),
                200
        );
        if (qrCode != null) {
            g.drawImage(qrCode, 50, 60, 200, 200, null);
        }

        // Organization details (right of QR)
        int textX = 280;
        g.setFont(new Font("SansSerif", Font.BOLD, 18));
        g.setColor(BACK_TEXT_DARK);
        g.drawString("APSUSM", textX, 90);

        g.setFont(new Font("SansSerif", Font.PLAIN, 10));
        g.setColor(BACK_TEXT_GRAY);
        g.drawString("Associação dos Profissionais de Saúde", textX, 115);
        g.drawString("Unidos e Solidários de Moçambique", textX, 130);

        // Divider
        g.setColor(BACK_BORDER);
        g.drawLine(textX, 150, CARD_WIDTH - 50, 150);

        // Member details
        g.setFont(new Font("SansSerif", Font.BOLD, 11));
        g.setColor(BACK_TEXT_DARK);
        g.drawString("MEMBER", textX, 175);

        g.setFont(new Font("SansSerif", Font.PLAIN, 13));
        g.setColor(BACK_TEXT_GRAY);
        g.drawString(member.getFullName(), textX, 195);

        g.setFont(new Font("SansSerif", Font.BOLD, 11));
        g.setColor(BACK_TEXT_DARK);
        g.drawString("MEMBER ID", textX, 225);

        g.setFont(new Font("Monospaced", Font.PLAIN, 14));
        g.setColor(BACK_TEXT_GRAY);
        g.drawString(member.getMemberId(), textX, 245);

        // Issue and expiry
        g.setFont(new Font("SansSerif", Font.BOLD, 11));
        g.setColor(BACK_TEXT_DARK);
        g.drawString("ISSUED", textX + 350, 175);

        String issued = member.getPaidAt() != null
                ? member.getPaidAt().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))
                : LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));
        g.setFont(new Font("SansSerif", Font.PLAIN, 13));
        g.setColor(BACK_TEXT_GRAY);
        g.drawString(issued, textX + 350, 195);

        g.setFont(new Font("SansSerif", Font.BOLD, 11));
        g.setColor(BACK_TEXT_DARK);
        g.drawString("EXPIRES", textX + 350, 225);

        String expiry = member.getExpiresAt() != null
                ? member.getExpiresAt().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))
                : LocalDateTime.now().plusYears(1).format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));
        g.setFont(new Font("SansSerif", Font.PLAIN, 13));
        g.setColor(BACK_TEXT_GRAY);
        g.drawString(expiry, textX + 350, 245);

        // Security notice
        g.setColor(BACK_BORDER);
        g.drawLine(50, CARD_HEIGHT - 200, CARD_WIDTH - 50, CARD_HEIGHT - 200);

        g.setFont(new Font("SansSerif", Font.PLAIN, 9));
        g.setColor(BACK_TEXT_GRAY);
        String[] securityText = {
                "This card certifies the bearer as a verified member of APSUSM.",
                "Membership is subject to annual renewal and compliance with the APSUSM Code of Ethics.",
                "Unauthorized reproduction or alteration of this card is strictly prohibited.",
                "To verify this membership, scan the QR code or visit: apsusm.org/verify"
        };
        int secY = CARD_HEIGHT - 175;
        for (String line : securityText) {
            g.drawString(line, 50, secY);
            secY += 18;
        }

        // Contact info at bottom
        g.setFont(new Font("SansSerif", Font.BOLD, 10));
        g.setColor(BACK_TEXT_DARK);
        g.drawString("Contact: info@apsusm.org  |  www.apsusm.org  |  Maputo, Moçambique", 50, CARD_HEIGHT - 50);

        // Bottom gradient line
        GradientPaint bottomGradient = new GradientPaint(0, 0, BRAND_BLUE, CARD_WIDTH, 0, BRAND_GREEN);
        g.setPaint(bottomGradient);
        g.fillRect(0, CARD_HEIGHT - 6, CARD_WIDTH, 6);

        g.dispose();
        return card;
    }

    // =========================================================================
    // Shared utilities
    // =========================================================================

    private void drawRoundedRect(Graphics2D g, int x, int y, int w, int h, int r, Color color) {
        g.setColor(color);
        g.fill(new RoundRectangle2D.Float(x, y, w, h, r, r));
    }

    private BufferedImage generateQRCode(String text, int size) {
        try {
            QRCodeWriter writer = new QRCodeWriter();
            Map<EncodeHintType, Object> hints = new HashMap<>();
            hints.put(EncodeHintType.MARGIN, 1);
            BitMatrix matrix = writer.encode(text, BarcodeFormat.QR_CODE, size, size, hints);

            BufferedImage image = new BufferedImage(size, size, BufferedImage.TYPE_INT_RGB);
            for (int ix = 0; ix < size; ix++) {
                for (int iy = 0; iy < size; iy++) {
                    image.setRGB(ix, iy, matrix.get(ix, iy) ? 0xFF1A1A2E : 0xFFF5F5FA);
                }
            }
            return image;
        } catch (Exception e) {
            log.error("QR code generation failed", e);
            return null;
        }
    }

    private void enableAntialiasing(Graphics2D g) {
        g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        g.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_LCD_HRGB);
        g.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
        g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BICUBIC);
    }
}
