package com.bakery.inventory.controller;

import com.bakery.inventory.service.PaymentService;
import com.razorpay.Utils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/webhooks")
@RequiredArgsConstructor
@Slf4j
public class RazorpayWebhookController {

    private final PaymentService paymentService;

    @Value("${razorpay.webhook.secret:}")
    private String webhookSecret;

    @PostMapping("/razorpay")
    public ResponseEntity<String> handleRazorpayWebhook(
            @RequestBody String requestBody,
            @RequestHeader(value = "X-Razorpay-Signature", required = false) String signature
    ) {
        if (webhookSecret != null && !webhookSecret.isBlank()) {
            if (signature == null || signature.isBlank()) {
                log.warn("Missing X-Razorpay-Signature in webhook request");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Missing signature");
            }
            try {
                boolean isValid = Utils.verifyWebhookSignature(requestBody, signature, webhookSecret);
                if (!isValid) {
                    log.warn("Invalid webhook signature received from Razorpay");
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid signature");
                }
            } catch (Exception e) {
                log.error("Error verifying Razorpay webhook signature: {}", e.getMessage(), e);
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Verification error");
            }
        }

        try {
            JSONObject json = new JSONObject(requestBody);
            String event = json.optString("event");
            log.info("Received Razorpay webhook event: {}", event);

            JSONObject payload = json.optJSONObject("payload");
            if (payload != null) {
                JSONObject paymentObj = payload.optJSONObject("payment");
                JSONObject paymentEntity = paymentObj != null ? paymentObj.optJSONObject("entity") : null;

                if (paymentEntity != null) {
                    String razorpayOrderId = paymentEntity.optString("order_id");
                    String razorpayPaymentId = paymentEntity.optString("id");

                    if ("payment.captured".equalsIgnoreCase(event) || "order.paid".equalsIgnoreCase(event)) {
                        paymentService.processWebhookPaymentCaptured(razorpayOrderId, razorpayPaymentId, signature != null ? signature : "");
                    } else if ("payment.failed".equalsIgnoreCase(event)) {
                        paymentService.processWebhookPaymentFailed(razorpayOrderId, razorpayPaymentId);
                    }
                }
            }
            return ResponseEntity.ok("OK");
        } catch (Exception e) {
            log.error("Error processing Razorpay webhook: {}", e.getMessage(), e);
            return ResponseEntity.ok("Handled with error");
        }
    }
}
