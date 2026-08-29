package com.bakery.inventory.repository;

import com.bakery.inventory.entity.OtpPurpose;
import com.bakery.inventory.entity.OtpVerification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface OtpVerificationRepository extends JpaRepository<OtpVerification, Long> {
    Optional<OtpVerification> findTopByUserAccountIdAndPurposeAndUsedAtIsNullOrderByCreatedAtDesc(Integer userId, OtpPurpose purpose);

    @Modifying
    @Query("""
            UPDATE OtpVerification o
            SET o.usedAt = CURRENT_TIMESTAMP
            WHERE o.userAccount.id = :userId
              AND o.purpose = :purpose
              AND o.usedAt IS NULL
            """)
    int invalidateActiveVerifications(
            @Param("userId") Integer userId,
            @Param("purpose") OtpPurpose purpose
    );

    @Modifying
    @Query("DELETE FROM OtpVerification o WHERE o.userAccount.id = :userId")
    void deleteByUserAccountId(@Param("userId") Integer userId);
}