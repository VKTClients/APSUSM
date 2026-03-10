package com.apsusm.service;

import com.apsusm.model.Member;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
public class CardGenerationService {

    private static final Logger log = LoggerFactory.getLogger(CardGenerationService.class);

    @Value("${app.cards.dir}")
    private String cardsDir;

    @Value("${app.card-generator.url:http://localhost:5500}")
    private String cardGeneratorUrl;

    /**
     * Generate both sides of the membership card using the Python card generator.
     * Returns paths: [frontPath, backPath]
     */
    public String[] generateCard(Member member) throws Exception {
        log.info("Generating card for member: {} (template mode)", member.getMemberId());

        Files.createDirectories(Paths.get(cardsDir));

        String frontFilename = member.getMemberId().replace("-", "_") + "_front.png";
        String backFilename = member.getMemberId().replace("-", "_") + "_back.png";

        Path frontPath = Paths.get(cardsDir, frontFilename);
        Path backPath = Paths.get(cardsDir, backFilename);

        byte[] frontPng = generateFrontCard(member);
        Files.write(frontPath, frontPng);
        log.info("Front card saved: {} ({} bytes)", frontPath, frontPng.length);

        byte[] backPng = generateBackCard(member);
        Files.write(backPath, backPng);
        log.info("Back card saved: {} ({} bytes)", backPath, backPng.length);

        return new String[]{frontPath.toString(), backPath.toString()};
    }

    private byte[] generateFrontCard(Member member) throws Exception {
        String endpoint = cardGeneratorUrl + "/api/generate-card-ai";
        log.info("Calling AI card generator: {}", endpoint);

        String boundary = "----CardGenBoundary" + System.currentTimeMillis();
        HttpURLConnection conn = openMultipartConnection(endpoint, boundary, 120_000);

        try (OutputStream os = conn.getOutputStream()) {
            writeFormField(os, boundary, "full_name", member.getFullName());
            writeFormField(os, boundary, "member_id", member.getMemberId());
            writeFormField(os, boundary, "user_id", member.getMemberId());

            if (member.getPhotoPath() == null) {
                throw new IllegalStateException("Member has no photo path set");
            }

            File photoFile = new File(member.getPhotoPath());
            if (!photoFile.exists()) {
                log.warn("Photo file not found: {}", member.getPhotoPath());
                throw new FileNotFoundException("Member photo not found: " + member.getPhotoPath());
            }

            writeFileField(os, boundary, "photo", photoFile);
            finishMultipart(os, boundary);
        }

        return readResponse(conn, "AI card generation");
    }

    private byte[] generateBackCard(Member member) throws Exception {
        String endpoint = cardGeneratorUrl + "/api/generate-card-back";
        log.info("Calling back card generator: {}", endpoint);

        String boundary = "----CardBackBoundary" + System.currentTimeMillis();
        HttpURLConnection conn = openMultipartConnection(endpoint, boundary, 60_000);

        try (OutputStream os = conn.getOutputStream()) {
            writeFormField(os, boundary, "membro_desde_date", formatBackDate(member.getPaidAt()));
            writeFormField(os, boundary, "valido_ate_date", formatBackDate(member.getExpiresAt()));
            finishMultipart(os, boundary);
        }

        return readResponse(conn, "Back card generation");
    }

    private HttpURLConnection openMultipartConnection(String endpoint, String boundary, int readTimeoutMs) throws IOException {
        URL url = new URL(endpoint);
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("POST");
        conn.setDoOutput(true);
        conn.setConnectTimeout(30_000);
        conn.setReadTimeout(readTimeoutMs);
        conn.setRequestProperty("Content-Type", "multipart/form-data; boundary=" + boundary);
        return conn;
    }

    private byte[] readResponse(HttpURLConnection conn, String operation) throws IOException {
        int responseCode = conn.getResponseCode();
        if (responseCode == 200) {
            try (InputStream is = conn.getInputStream()) {
                return is.readAllBytes();
            }
        }

        String errorBody;
        try (InputStream es = conn.getErrorStream()) {
            errorBody = es != null ? new String(es.readAllBytes()) : "No error body";
        }
        log.error("{} failed (HTTP {}): {}", operation, responseCode, errorBody);
        throw new RuntimeException(operation + " failed (HTTP " + responseCode + "): " + errorBody);
    }

    private void finishMultipart(OutputStream os, String boundary) throws IOException {
        os.write(("--" + boundary + "--\r\n").getBytes());
        os.flush();
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

    private String formatBackDate(LocalDateTime dateTime) {
        LocalDateTime value = dateTime != null ? dateTime : LocalDateTime.now();
        return value.format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));
    }
}
