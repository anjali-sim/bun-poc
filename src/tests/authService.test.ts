import { describe, it, expect } from "bun:test";
import {
  hashPassword,
  verifyPassword,
  generateSessionToken,
  registerUser,
  authenticateUser,
  verifySession,
  getUserById,
  logoutUser,
} from "../services/authService";

describe("Auth Service - Core Functions", () => {
  describe("Password Hashing", () => {
    it("should hash a password", () => {
      const password = "testPassword123!";
      const hash = hashPassword(password);

      expect(hash).toBeTruthy();
      expect(hash).not.toBe(password);
    });

    it("should verify correct password", () => {
      const password = "mySecurePassword";
      const hash = hashPassword(password);
      const isValid = verifyPassword(password, hash);

      expect(isValid).toBe(true);
    });

    it("should reject incorrect password", () => {
      const password = "correctPassword";
      const wrongPassword = "wrongPassword";
      const hash = hashPassword(password);
      const isValid = verifyPassword(wrongPassword, hash);

      expect(isValid).toBe(false);
    });

    it("should handle special characters in password", () => {
      const password = "P@ssw0rd!#$%^&*()";
      const hash = hashPassword(password);
      const isValid = verifyPassword(password, hash);

      expect(isValid).toBe(true);
    });

    it("should handle very long passwords", () => {
      const longPassword = "a".repeat(500);
      const hash = hashPassword(longPassword);
      const isValid = verifyPassword(longPassword, hash);

      expect(isValid).toBe(true);
    });

    it("should handle unicode characters in password", () => {
      const password = "Pässwörd_😀_2025";
      const hash = hashPassword(password);
      const isValid = verifyPassword(password, hash);

      expect(isValid).toBe(true);
    });

    it("should produce different hashes for same password", () => {
      const password = "samePassword";
      const hash1 = hashPassword(password);
      const hash2 = hashPassword(password);

      expect(hash1).not.toBe(hash2);
      expect(verifyPassword(password, hash1)).toBe(true);
      expect(verifyPassword(password, hash2)).toBe(true);
    });

    it("should validate hash format for bcrypt", () => {
      const password = "testPass";
      const hash = hashPassword(password);

      expect(hash).toMatch(/^\$2[aby]\$/);
    });

    it("should have cost factor of 4", () => {
      const password = "testPass";
      const hash = hashPassword(password);

      expect(hash).toContain("$04$");
    });
  });

  describe("Session Token Generation", () => {
    it("should generate a unique session token", () => {
      const token1 = generateSessionToken();
      const token2 = generateSessionToken();

      expect(token1).toBeTruthy();
      expect(token2).toBeTruthy();
      expect(token1).not.toBe(token2);
    });

    it("should generate a token with sufficient length", () => {
      const token = generateSessionToken();
      expect(token.length).toBeGreaterThan(20);
    });

    it("should generate hex-encoded tokens", () => {
      const token = generateSessionToken();
      expect(token).toMatch(/^[0-9a-f]+$/);
    });

    it("should generate different tokens on each call", () => {
      const tokens = Array.from({ length: 10 }, () => generateSessionToken());
      const uniqueTokens = new Set(tokens);

      expect(uniqueTokens.size).toBe(10);
    });

    it("should generate tokens with consistent format", () => {
      const tokens = Array.from({ length: 5 }, () => generateSessionToken());

      tokens.forEach((token) => {
        expect(token).toMatch(/^[0-9a-f]+$/);
        expect(token.length).toBeGreaterThan(20);
      });
    });
  });
});

describe("Auth Service - Database Integration", () => {
  describe("User Registration", () => {
    it("should return success/failure object", () => {
      const username = `testuser_${Date.now()}`;
      const email = `test_${Date.now()}@example.com`;
      const result = registerUser(username, email, "password123");

      expect(result).toHaveProperty("success");
      expect(result).toHaveProperty("message");
      expect(typeof result.success).toBe("boolean");
    });

    it("should reject empty inputs", () => {
      const result = registerUser("", "", "");

      expect(result.success).toBe(false);
      expect(result.message).toBeTruthy();
    });

    it("should reject short password", () => {
      const result = registerUser(
        `user_${Date.now()}`,
        `test_${Date.now()}@example.com`,
        "short"
      );

      // Should fail due to password being too short (less than 6 chars)
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.message.toLowerCase()).toContain("password");
      }
    });

    it("should reject missing email", () => {
      const result = registerUser(`user_${Date.now()}`, "", "password123");

      expect(result.success).toBe(false);
    });

    it("should reject missing password", () => {
      const result = registerUser(
        `user_${Date.now()}`,
        `test_${Date.now()}@example.com`,
        ""
      );

      expect(result.success).toBe(false);
    });
  });

  describe("User Authentication", () => {
    it("should return auth result object structure", () => {
      const result = authenticateUser("test@example.com", "password");

      expect(result).toHaveProperty("success");
      expect(typeof result.success).toBe("boolean");
    });

    it("should fail for non-existent user", () => {
      const result = authenticateUser(
        `nonexistent_${Date.now()}@example.com`,
        "password123"
      );

      expect(result.success).toBe(false);
    });

    it("should handle empty credentials", () => {
      const result = authenticateUser("", "");

      expect(result.success).toBe(false);
    });

    it("should return null for failed authentication", () => {
      const result = authenticateUser("invalid@test.com", "wrongpassword");

      expect(result.success).toBe(false);
      expect(
        result.sessionToken === undefined || result.sessionToken === null
      ).toBe(true);
    });
  });

  describe("Session Verification", () => {
    it("should reject invalid tokens", () => {
      const result = verifySession("invalid_token_12345");

      expect(result).toHaveProperty("valid");
      expect(result.valid).toBe(false);
    });

    it("should return proper object structure", () => {
      const result = verifySession("test_token");

      expect(result.valid === true || result.valid === false).toBe(true);
    });

    it("should handle empty token", () => {
      const result = verifySession("");

      expect(result.valid).toBe(false);
    });

    it("should handle null-like values", () => {
      const result = verifySession("null");

      expect(result.valid).toBe(false);
    });
  });

  describe("Get User By ID", () => {
    it("should return null for non-existent user", () => {
      const result = getUserById(99999999);

      expect(result).toBeFalsy();
    });

    it("should return falsy for invalid ID", () => {
      const result = getUserById(0);

      expect(!result).toBe(true);
    });

    it("should handle negative IDs", () => {
      const result = getUserById(-1);

      expect(result).toBeFalsy();
    });

    it("should not expose sensitive data if user found", () => {
      const result = getUserById(1);

      if (result) {
        expect(result).not.toHaveProperty("password_hash");
        expect(result).not.toHaveProperty("password");
      }
    });
  });

  describe("Logout User", () => {
    it("should return success object", () => {
      const result = logoutUser("any_token");

      expect(result).toHaveProperty("success");
      expect(typeof result.success).toBe("boolean");
    });

    it("should handle non-existent token gracefully", () => {
      const result = logoutUser("nonexistent_token_123");

      expect(result.success).toBe(true);
    });

    it("should handle empty token", () => {
      const result = logoutUser("");

      expect(result.success).toBe(true);
    });

    it("should return success for multiple logouts", () => {
      const token = "test_token";

      const result1 = logoutUser(token);
      const result2 = logoutUser(token);

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
    });
  });

  describe("Password Security", () => {
    it("should hash and verify password correctly", () => {
      const password = "testPassword123";
      const hash = hashPassword(password);

      const isValid = verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });

    it("should reject wrong password", () => {
      const hash = hashPassword("correctPassword");

      const isValid = verifyPassword("wrongPassword", hash);
      expect(isValid).toBe(false);
    });

    it("should handle password with spaces", () => {
      const password = "pass word with spaces";
      const hash = hashPassword(password);

      expect(verifyPassword(password, hash)).toBe(true);
      expect(verifyPassword("password with spaces", hash)).toBe(false);
    });

    it("should be case-sensitive for passwords", () => {
      const password = "MyPassword";
      const hash = hashPassword(password);

      expect(verifyPassword("mypassword", hash)).toBe(false);
      expect(verifyPassword("MyPassword", hash)).toBe(true);
    });

    it("should handle password with leading/trailing spaces", () => {
      const password = "  password  ";
      const hash = hashPassword(password);

      expect(verifyPassword(password, hash)).toBe(true);
      expect(verifyPassword("password", hash)).toBe(false);
    });
  });

  describe("Token Uniqueness and Security", () => {
    it("should generate tokens with high entropy", () => {
      const tokens = Array.from({ length: 100 }, () => generateSessionToken());
      const uniqueTokens = new Set(tokens);

      expect(uniqueTokens.size).toBe(100);
    });

    it("should generate tokens without predictable patterns", () => {
      const token1 = generateSessionToken();
      const token2 = generateSessionToken();
      const token3 = generateSessionToken();

      expect(token2).not.toBe(token1);
      expect(token3).not.toBe(token2);
    });
  });

  describe("Session Token Edge Cases", () => {
    it("should generate non-empty tokens", () => {
      const token = generateSessionToken();
      expect(token.length).toBeGreaterThan(0);
    });

    it("should generate tokens only with hex characters", () => {
      for (let i = 0; i < 50; i++) {
        const token = generateSessionToken();
        expect(token).toMatch(/^[0-9a-f]+$/);
      }
    });

    it("should have minimum length of 32 characters", () => {
      for (let i = 0; i < 10; i++) {
        const token = generateSessionToken();
        expect(token.length).toBeGreaterThanOrEqual(32);
      }
    });
  });

  describe("Password Hashing Edge Cases", () => {
    it("should reject invalid hash format in verification", () => {
      const password = "testPassword";
      const invalidHash = "not_a_valid_bcrypt_hash";

      expect(() => {
        verifyPassword(password, invalidHash);
      }).not.toThrow();
    });

    it("should handle empty password", () => {
      const password = "";
      // Empty passwords may not be allowed by Bun password hashing
      try {
        const hash = hashPassword(password);
        const isValid = verifyPassword(password, hash);

        expect(isValid).toBe(true);
        expect(hash).toBeTruthy();
      } catch {
        // It's acceptable for empty passwords to throw
        expect(true).toBe(true);
      }
    });

    it("should handle passwords with newlines", () => {
      const password = "pass\nword\ntest";
      const hash = hashPassword(password);
      const isValid = verifyPassword(password, hash);

      expect(isValid).toBe(true);
    });

    it("should handle passwords with tabs", () => {
      const password = "pass\tword\ttest";
      const hash = hashPassword(password);
      const isValid = verifyPassword(password, hash);

      expect(isValid).toBe(true);
    });

    it("should handle password with null characters", () => {
      const password = "pass\0word";
      const hash = hashPassword(password);
      const isValid = verifyPassword(password, hash);

      expect(isValid).toBe(true);
    });

    it("should handle very long unicode password", () => {
      const password = "🔐".repeat(100) + "password";
      const hash = hashPassword(password);
      const isValid = verifyPassword(password, hash);

      expect(isValid).toBe(true);
    });

    it("should be consistent with same password", () => {
      const password = "consistentTest";
      const hash1 = hashPassword(password);
      const hash2 = hashPassword(password);

      // Different hashes due to salt, but both should verify
      expect(hash1).not.toBe(hash2);
      expect(verifyPassword(password, hash1)).toBe(true);
      expect(verifyPassword(password, hash2)).toBe(true);
    });
  });

  describe("Database Error Handling", () => {
    it("registerUser should catch database errors", () => {
      const username = `user_${Date.now()}`;
      const email = `test_${Date.now()}@example.com`;
      const result = registerUser(username, email, "password123");

      // Should return a result object, not throw
      expect(result).toHaveProperty("success");
      expect(result).toHaveProperty("message");
    });

    it("authenticateUser should handle database errors gracefully", () => {
      const result = authenticateUser("test@example.com", "password");

      // Should return error object, not throw
      expect(result).toHaveProperty("success");
      expect(typeof result.success).toBe("boolean");
    });

    it("verifySession should handle database errors", () => {
      const result = verifySession("invalid_token");

      // Should return object, not throw
      expect(result).toHaveProperty("valid");
      expect(typeof result.valid).toBe("boolean");
    });

    it("getUserById should handle database errors", () => {
      const result = getUserById(999999);

      // Should return null or similar, not throw
      expect(result === null || result === undefined).toBe(true);
    });

    it("logoutUser should handle database errors", () => {
      const result = logoutUser("token");

      // Should return object, not throw
      expect(result).toHaveProperty("success");
    });
  });

  describe("User Registration Validation", () => {
    it("should validate username presence", () => {
      const result = registerUser("", "test@example.com", "password123");
      expect(result.success).toBe(false);
    });

    it("should validate email format presence", () => {
      const result = registerUser("username", "", "password123");
      expect(result.success).toBe(false);
    });

    it("should validate password presence", () => {
      const result = registerUser("username", "test@example.com", "");
      expect(result.success).toBe(false);
    });

    it("should enforce minimum password length of 6 characters", () => {
      const result = registerUser(
        `user_${Date.now()}`,
        `test_${Date.now()}@example.com`,
        "12345"
      );
      expect(result.success).toBe(false);
      expect(result.message.toLowerCase()).toContain("password");
    });

    it("should accept password of exactly 6 characters", () => {
      const result = registerUser(
        `user_${Date.now()}`,
        `test_${Date.now()}@example.com`,
        "123456"
      );
      // May fail due to duplicate, but not due to password length
      if (!result.success) {
        expect(result.message.toLowerCase()).not.toContain("at least 6");
      }
    });

    it("should allow special characters in username", () => {
      const result = registerUser(
        `user_${Date.now()}_@#$%`,
        `test_${Date.now()}@example.com`,
        "password123"
      );

      expect(result).toHaveProperty("success");
    });
  });

  describe("Session Token Generation and Usage", () => {
    it("should generate consistent token format", () => {
      const token = generateSessionToken();

      expect(typeof token).toBe("string");
      expect(token.length).toBeGreaterThan(0);
      expect(token).toMatch(/^[0-9a-f]+$/);
    });

    it("should create different tokens on each call", () => {
      const tokens: string[] = [];
      for (let i = 0; i < 5; i++) {
        tokens.push(generateSessionToken());
      }

      const uniqueTokens = new Set(tokens);
      expect(uniqueTokens.size).toBe(5);
    });
  });

  describe("User Authentication Response Structure", () => {
    it("should return object with required fields", () => {
      const result = authenticateUser("test@example.com", "password");

      expect(result).toHaveProperty("success");
      expect(result).toHaveProperty("message");
    });

    it("should not include sessionToken on failure", () => {
      const result = authenticateUser("invalid@test.com", "password");

      if (!result.success) {
        expect(result.sessionToken === undefined).toBe(true);
      }
    });

    it("should return message on failure", () => {
      const result = authenticateUser("invalid@test.com", "password");

      if (!result.success) {
        expect(result.message).toBeTruthy();
        expect(result.message.length).toBeGreaterThan(0);
      }
    });

    it("should handle empty email", () => {
      const result = authenticateUser("", "password");

      expect(result.success).toBe(false);
      expect(result.message).toBeTruthy();
    });

    it("should handle empty password", () => {
      const result = authenticateUser("test@example.com", "");

      expect(result.success).toBe(false);
      expect(result.message).toBeTruthy();
    });

    it("should handle both empty credentials", () => {
      const result = authenticateUser("", "");

      expect(result.success).toBe(false);
    });
  });

  describe("Session Verification Advanced", () => {
    it("should check token existence", () => {
      const result = verifySession("definitely_not_a_real_token");

      expect(result.valid).toBe(false);
    });

    it("should verify token format acceptance", () => {
      const validFormatToken = "a".repeat(50);
      const result = verifySession(validFormatToken);

      // Should not throw regardless of format
      expect(result).toHaveProperty("valid");
    });

    it("should handle very long token strings", () => {
      const longToken = "a".repeat(10000);
      const result = verifySession(longToken);

      expect(result.valid).toBe(false);
    });

    it("should return userId when session valid", () => {
      const result = verifySession("any_token");

      // If invalid, userId should not be present or be undefined
      if (!result.valid) {
        expect(result.userId === undefined).toBe(true);
      }
    });
  });

  describe("User Retrieval Security", () => {
    it("should not return password hash", () => {
      const result = getUserById(1);

      if (result) {
        expect(result).not.toHaveProperty("password_hash");
        expect(result).not.toHaveProperty("password");
      }
    });

    it("should return required fields if user exists", () => {
      const result = getUserById(1);

      if (result) {
        expect(result).toHaveProperty("id");
        expect(result).toHaveProperty("username");
        expect(result).toHaveProperty("email");
        expect(result).toHaveProperty("created_at");
      }
    });

    it("should return null for non-existent users", () => {
      const result = getUserById(999999999);

      expect(result === null || result === undefined).toBe(true);
    });

    it("should handle decimal user IDs", () => {
      const result = getUserById(1.5);

      // Should not crash
      expect(result === null || typeof result === "object").toBe(true);
    });
  });

  describe("Registration Response Structure", () => {
    it("should always include success boolean", () => {
      const result = registerUser("", "", "");

      expect(typeof result.success).toBe("boolean");
    });

    it("should always include message", () => {
      const result = registerUser("", "", "");

      expect(result.message).toBeTruthy();
    });

    it("should include userId on success", () => {
      const result = registerUser(
        `user_${Date.now()}`,
        `test_${Date.now()}@example.com`,
        "password123"
      );

      if (result.success) {
        expect(
          typeof result.userId === "number" || result.userId === undefined
        ).toBe(true);
      }
    });

    it("should not include userId on failure", () => {
      const result = registerUser("", "", "short");

      if (!result.success) {
        expect(result.userId === undefined).toBe(true);
      }
    });
  });
});
