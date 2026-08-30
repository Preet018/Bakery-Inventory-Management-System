package com.bakery.inventory.exception;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.BindException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.support.MissingServletRequestPartException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleResourceNotFound(ResourceNotFoundException exception, HttpServletRequest request) {
        log.debug("Resource not found at {}: {}", request.getRequestURI(), exception.getMessage());
        return buildResponse(
                HttpStatus.NOT_FOUND,
                "NOT_FOUND",
                exception.getMessage(),
                null,
                request
        );
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ErrorResponse> handleNoResourceFound(NoResourceFoundException exception, HttpServletRequest request) {
        log.debug("Resource path not found at {}: {}", request.getRequestURI(), exception.getMessage());
        return buildResponse(
                HttpStatus.NOT_FOUND,
                "NOT_FOUND",
                "The requested resource was not found: " + exception.getResourcePath(),
                null,
                request
        );
    }

    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<ErrorResponse> handleBadRequest(BadRequestException exception, HttpServletRequest request) {
        log.debug("Bad request at {}: {}", request.getRequestURI(), exception.getMessage());
        return buildResponse(
                HttpStatus.BAD_REQUEST,
                "BAD_REQUEST",
                exception.getMessage(),
                null,
                request
        );
    }

    @ExceptionHandler(BusinessRuleException.class)
    public ResponseEntity<ErrorResponse> handleBusinessRule(BusinessRuleException exception, HttpServletRequest request) {
        log.info("Business rule violation at {}: {}", request.getRequestURI(), exception.getMessage());
        return buildResponse(
                HttpStatus.CONFLICT,
                "BUSINESS_RULE_VIOLATION",
                exception.getMessage(),
                null,
                request
        );
    }

    @ExceptionHandler(InsufficientStockException.class)
    public ResponseEntity<ErrorResponse> handleInsufficientStock(InsufficientStockException exception, HttpServletRequest request) {
        log.info("Insufficient stock at {}: {}", request.getRequestURI(), exception.getMessage());
        return buildResponse(
                HttpStatus.CONFLICT,
                "INSUFFICIENT_STOCK",
                exception.getMessage(),
                null,
                request
        );
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDenied(AccessDeniedException exception, HttpServletRequest request) {
        log.info("Access denied at {}: {}", request.getRequestURI(), exception.getMessage());
        return buildResponse(
                HttpStatus.FORBIDDEN,
                "ACCESS_DENIED",
                "You are not authorized to access this resource.",
                null,
                request
        );
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ErrorResponse> handleAuthenticationException(AuthenticationException exception, HttpServletRequest request) {
        log.info("Authentication failed at {}: {}", request.getRequestURI(), exception.getMessage());
        return buildResponse(
                HttpStatus.UNAUTHORIZED,
                "AUTHENTICATION_FAILED",
                "Invalid credentials or account is not eligible for authentication.",
                null,
                request
        );
    }

    @ExceptionHandler(EmailNotVerifiedException.class)
    public ResponseEntity<ErrorResponse> handleEmailNotVerified(EmailNotVerifiedException exception, HttpServletRequest request) {
        log.info("Email not verified at {}: {}", request.getRequestURI(), exception.getMessage());
        return buildResponse(
                HttpStatus.FORBIDDEN,
                "EMAIL_NOT_VERIFIED",
                exception.getMessage(),
                null,
                request
        );
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleMethodArgumentNotValid(MethodArgumentNotValidException exception, HttpServletRequest request) {
        Map<String, String> fieldErrors = new LinkedHashMap<>();

        exception.getBindingResult()
                .getFieldErrors()
                .forEach(error ->
                        fieldErrors.put(
                                error.getField(),
                                error.getDefaultMessage()
                        )
                );

        String summaryMessage = fieldErrors.isEmpty()
                ? "Request validation failed"
                : fieldErrors.values().iterator().next();

        log.debug("Validation failed at {}: {}", request.getRequestURI(), fieldErrors);
        return buildResponse(
                HttpStatus.BAD_REQUEST,
                "VALIDATION_FAILED",
                summaryMessage,
                fieldErrors,
                request
        );
    }

    @ExceptionHandler(BindException.class)
    public ResponseEntity<ErrorResponse> handleBindException(BindException exception, HttpServletRequest request) {
        Map<String, String> fieldErrors = new LinkedHashMap<>();

        exception.getBindingResult()
                .getFieldErrors()
                .forEach(error ->
                        fieldErrors.put(
                                error.getField(),
                                error.getDefaultMessage()
                        )
                );

        String summaryMessage = fieldErrors.isEmpty()
                ? "Request validation failed"
                : fieldErrors.values().iterator().next();

        log.debug("Binding validation failed at {}: {}", request.getRequestURI(), fieldErrors);
        return buildResponse(
                HttpStatus.BAD_REQUEST,
                "VALIDATION_FAILED",
                summaryMessage,
                fieldErrors,
                request
        );
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ErrorResponse> handleConstraintViolation(ConstraintViolationException exception, HttpServletRequest request) {
        Map<String, String> fieldErrors = new LinkedHashMap<>();

        exception.getConstraintViolations()
                .forEach(violation -> {
                    String propPath = violation.getPropertyPath().toString();
                    // Strip method prefix if present (e.g. createProduct.productDTO.name -> name)
                    String fieldName = propPath.contains(".")
                            ? propPath.substring(propPath.lastIndexOf('.') + 1)
                            : propPath;
                    fieldErrors.put(fieldName, violation.getMessage());
                });

        String summaryMessage = fieldErrors.isEmpty()
                ? "Request validation failed"
                : fieldErrors.values().iterator().next();

        log.debug("Constraint violation at {}: {}", request.getRequestURI(), fieldErrors);
        return buildResponse(
                HttpStatus.BAD_REQUEST,
                "VALIDATION_FAILED",
                summaryMessage,
                fieldErrors,
                request
        );
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponse> handleHttpMessageNotReadable(HttpMessageNotReadableException exception, HttpServletRequest request) {
        log.debug("Malformed request body at {}: {}", request.getRequestURI(), exception.getMessage());
        return buildResponse(
                HttpStatus.BAD_REQUEST,
                "MALFORMED_REQUEST",
                "Request body is malformed or contains invalid values.",
                null,
                request
        );
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ErrorResponse> handleMissingRequestParameter(MissingServletRequestParameterException exception, HttpServletRequest request) {
        log.debug("Missing request parameter at {}: {}", request.getRequestURI(), exception.getParameterName());
        return buildResponse(
                HttpStatus.BAD_REQUEST,
                "MISSING_REQUEST_PARAMETER",
                "Required request parameter is missing: " + exception.getParameterName(),
                null,
                request
        );
    }

    @ExceptionHandler(MissingServletRequestPartException.class)
    public ResponseEntity<ErrorResponse> handleMissingServletRequestPart(MissingServletRequestPartException exception, HttpServletRequest request) {
        log.debug("Missing request part at {}: {}", request.getRequestURI(), exception.getRequestPartName());
        return buildResponse(
                HttpStatus.BAD_REQUEST,
                "MISSING_REQUEST_PART",
                "Required request part is missing: " + exception.getRequestPartName(),
                null,
                request
        );
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorResponse> handleTypeMismatch(MethodArgumentTypeMismatchException exception, HttpServletRequest request) {
        log.debug("Parameter type mismatch at {}: {}", request.getRequestURI(), exception.getName());
        return buildResponse(
                HttpStatus.BAD_REQUEST,
                "INVALID_PARAMETER",
                "Invalid value for parameter: " + exception.getName(),
                null,
                request
        );
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ErrorResponse> handleMethodNotSupported(HttpRequestMethodNotSupportedException exception, HttpServletRequest request) {
        log.debug("HTTP method not supported at {}: {}", request.getRequestURI(), exception.getMethod());
        return buildResponse(
                HttpStatus.METHOD_NOT_ALLOWED,
                "METHOD_NOT_ALLOWED",
                "HTTP method '" + exception.getMethod() + "' is not supported for this endpoint.",
                null,
                request
        );
    }

    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    public ResponseEntity<ErrorResponse> handleMediaTypeNotSupported(HttpMediaTypeNotSupportedException exception, HttpServletRequest request) {
        log.debug("Media type not supported at {}: {}", request.getRequestURI(), exception.getContentType());
        return buildResponse(
                HttpStatus.UNSUPPORTED_MEDIA_TYPE,
                "UNSUPPORTED_MEDIA_TYPE",
                "Content type '" + exception.getContentType() + "' is not supported.",
                null,
                request
        );
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ErrorResponse> handleMaxUploadSizeExceeded(MaxUploadSizeExceededException exception, HttpServletRequest request) {
        log.debug("File too large at {}: {}", request.getRequestURI(), exception.getMessage());
        return buildResponse(
                HttpStatus.BAD_REQUEST,
                "FILE_TOO_LARGE",
                "Uploaded file exceeds the maximum allowed size.",
                null,
                request
        );
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErrorResponse> handleDataIntegrityViolation(DataIntegrityViolationException exception, HttpServletRequest request) {
        log.info("Data integrity violation at {}: {}", request.getRequestURI(), exception.getMessage());
        return buildResponse(
                HttpStatus.CONFLICT,
                "DATA_INTEGRITY_VIOLATION",
                "The request conflicts with existing data.",
                null,
                request
        );
    }

    @ExceptionHandler(StorageException.class)
    public ResponseEntity<ErrorResponse> handleStorageException(StorageException exception, HttpServletRequest request) {
        log.error("Internal storage error at {}: {}", request.getRequestURI(), exception.getMessage(), exception);
        return buildResponse(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "STORAGE_ERROR",
                "An internal file storage error occurred.",
                null,
                request
        );
    }

    @ExceptionHandler(PaymentGatewayException.class)
    public ResponseEntity<ErrorResponse> handlePaymentGatewayException(PaymentGatewayException exception, HttpServletRequest request) {
        log.error("Payment gateway error at {}: {}", request.getRequestURI(), exception.getMessage(), exception);
        return buildResponse(
                HttpStatus.BAD_GATEWAY,
                "PAYMENT_GATEWAY_ERROR",
                "Payment gateway is currently unavailable. Please try again later.",
                null,
                request
        );
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgument(IllegalArgumentException exception, HttpServletRequest request) {
        log.debug("Illegal argument at {}: {}", request.getRequestURI(), exception.getMessage());
        return buildResponse(
                HttpStatus.BAD_REQUEST,
                "BAD_REQUEST",
                exception.getMessage() != null ? exception.getMessage() : "Invalid argument provided.",
                null,
                request
        );
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ErrorResponse> handleIllegalState(IllegalStateException exception, HttpServletRequest request) {
        log.info("Illegal state at {}: {}", request.getRequestURI(), exception.getMessage());
        return buildResponse(
                HttpStatus.CONFLICT,
                "BUSINESS_RULE_VIOLATION",
                exception.getMessage() != null ? exception.getMessage() : "Operation cannot be performed in the current state.",
                null,
                request
        );
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleUnexpectedException(Exception exception, HttpServletRequest request) {
        log.error("Unhandled unexpected exception at URI [{}]: {}", request.getRequestURI(), exception.getMessage(), exception);
        return buildResponse(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "INTERNAL_SERVER_ERROR",
                "An unexpected server error occurred. Please try again later.",
                null,
                request
        );
    }

    private ResponseEntity<ErrorResponse> buildResponse(HttpStatus status, String error, String message, Map<String, String> fieldErrors, HttpServletRequest request) {
        ErrorResponse response = new ErrorResponse(
                LocalDateTime.now(),
                status.value(),
                error,
                message,
                request.getRequestURI(),
                fieldErrors
        );

        return ResponseEntity
                .status(status)
                .body(response);
    }
}