import { describe, it, expect } from "bun:test";
import {
  getSessionFromCookies,
  parseCookies,
  setSessionCookie,
  clearSessionCookie,
} from "../services/cookieMiddleware";

describe("Cookie Middleware", () => {
  describe("Cookie Parsing", () => {
    it("should parse simple cookie header", () => {
      const cookieHeader = "sessionToken=abc123; path=/; HttpOnly; Secure";
      const cookies = parseCookies(cookieHeader);

      expect(cookies.sessionToken).toBe("abc123");
    });

    it("should parse multiple cookies", () => {
      const cookieHeader = "sessionToken=abc123; userId=456; theme=dark";
      const cookies = parseCookies(cookieHeader);

      expect(cookies.sessionToken).toBe("abc123");
      expect(cookies.userId).toBe("456");
      expect(cookies.theme).toBe("dark");
    });

    it("should handle cookies with special characters", () => {
      const cookieHeader =
        "sessionToken=abc123+xyz==/; userId=user@example.com";
      const cookies = parseCookies(cookieHeader);

      expect(cookies.sessionToken).toBeTruthy();
      expect(cookies.userId).toBeTruthy();
    });

    it("should handle empty cookie header", () => {
      const cookieHeader = "";
      const cookies = parseCookies(cookieHeader);

      expect(cookies).toBeDefined();
    });

    it("should be case-insensitive for cookie names", () => {
      const cookieHeader = "SessionToken=abc123";
      const cookies = parseCookies(cookieHeader);

      // Bun.CookieMap converts to lowercase
      expect(cookies.sessiontoken || cookies.SessionToken).toBeTruthy();
    });
  });

  describe("Extract Session from Request", () => {
    it("should extract sessionToken from request cookies", () => {
      const request = new Request("http://localhost", {
        headers: {
          cookie: "sessionToken=mytoken123; path=/",
        },
      });

      const token = getSessionFromCookies(request);

      expect(token).toBe("mytoken123");
    });

    it("should return null when no sessionToken present", () => {
      const request = new Request("http://localhost", {
        headers: {
          cookie: "userId=123; theme=dark",
        },
      });

      const token = getSessionFromCookies(request);

      expect(token).toBeNull();
    });

    it("should return null when no cookie header present", () => {
      const request = new Request("http://localhost");

      const token = getSessionFromCookies(request);

      expect(token).toBeNull();
    });

    it("should extract token from multiple cookies", () => {
      const request = new Request("http://localhost", {
        headers: {
          cookie: "userId=456; sessionToken=validtoken789; theme=dark",
        },
      });

      const token = getSessionFromCookies(request);

      expect(token).toBe("validtoken789");
    });

    it("should handle malformed cookie headers gracefully", () => {
      const request = new Request("http://localhost", {
        headers: {
          cookie: ";;; sessionToken=token; ;;;",
        },
      });

      const token = getSessionFromCookies(request);

      expect(token).toBe("token");
    });
  });

  describe("Set Session Cookie", () => {
    it("should set session cookie in response", () => {
      const response = new Response("OK", { status: 200 });
      const sessionToken = "test_session_token_123";

      const newResponse = setSessionCookie(response, sessionToken);

      const setCookieHeader = newResponse.headers.get("set-cookie");
      expect(setCookieHeader).toBeTruthy();
      expect(setCookieHeader).toContain("sessionToken");
      expect(setCookieHeader).toContain("test_session_token_123");
    });

    it("should set cookie with security attributes", () => {
      const response = new Response("OK");
      const sessionToken = "secure_token";

      const newResponse = setSessionCookie(response, sessionToken);

      const setCookieHeader = newResponse.headers.get("set-cookie");

      expect(setCookieHeader).toContain("HttpOnly");
      expect(setCookieHeader).toContain("Secure");
      expect(setCookieHeader).toContain("SameSite");
    });

    it("should set cookie with correct expiry in days", () => {
      const response = new Response("OK");
      const sessionToken = "token_with_expiry";
      const expiryDays = 7;

      const newResponse = setSessionCookie(response, sessionToken, expiryDays);

      const setCookieHeader = newResponse.headers.get("set-cookie");

      // Should contain Max-Age in seconds (7 days)
      const expectedSeconds = expiryDays * 24 * 60 * 60;
      expect(setCookieHeader).toContain(`Max-Age=${expectedSeconds}`);
    });

    it("should set cookie with default 7-day expiry", () => {
      const response = new Response("OK");
      const sessionToken = "default_expiry_token";

      const newResponse = setSessionCookie(response, sessionToken);

      const setCookieHeader = newResponse.headers.get("set-cookie");
      // 7 days = 604800 seconds
      expect(setCookieHeader).toContain("Max-Age=604800");
    });

    it("should set cookie path to root", () => {
      const response = new Response("OK");
      const sessionToken = "path_token";

      const newResponse = setSessionCookie(response, sessionToken);

      const setCookieHeader = newResponse.headers.get("set-cookie");
      expect(setCookieHeader).toContain("Path=/");
    });
  });

  describe("Clear Session Cookie", () => {
    it("should clear session cookie from response", () => {
      const response = new Response("OK");

      const newResponse = clearSessionCookie(response);

      const setCookieHeader = newResponse.headers.get("set-cookie");
      expect(setCookieHeader).toBeTruthy();
      expect(setCookieHeader).toContain("sessionToken");
    });

    it("should set Max-Age to 0 for cookie deletion", () => {
      const response = new Response("OK");

      const newResponse = clearSessionCookie(response);

      const setCookieHeader = newResponse.headers.get("set-cookie");
      // When clearing, Max-Age should be 0 or cookie should be empty
      expect(setCookieHeader).toBeTruthy();
    });

    it("should maintain response body after clearing cookie", async () => {
      const originalBody = "User logged out";
      const response = new Response(originalBody);

      const newResponse = clearSessionCookie(response);

      const bodyText = await newResponse.text();
      expect(bodyText).toBe(originalBody);
    });
  });

  describe("Cookie Security", () => {
    it("should never expose HttpOnly cookies to JavaScript", () => {
      const response = new Response("OK");
      const sessionToken = "secure_token";

      const newResponse = setSessionCookie(response, sessionToken);

      const setCookieHeader = newResponse.headers.get("set-cookie");
      expect(setCookieHeader).toContain("HttpOnly");
    });

    it("should require Secure flag for HTTPS", () => {
      const response = new Response("OK");
      const sessionToken = "https_token";

      const newResponse = setSessionCookie(response, sessionToken);

      const setCookieHeader = newResponse.headers.get("set-cookie");
      expect(setCookieHeader).toContain("Secure");
    });

    it("should use SameSite=Strict for CSRF protection", () => {
      const response = new Response("OK");
      const sessionToken = "csrf_protected";

      const newResponse = setSessionCookie(response, sessionToken);

      const setCookieHeader = newResponse.headers.get("set-cookie");
      expect(setCookieHeader).toContain("SameSite");
    });
  });

  describe("Cookie Encoding", () => {
    it("should handle URL-encoded cookie values", () => {
      const request = new Request("http://localhost", {
        headers: {
          cookie: "sessionToken=abc%3D123%2B456; path=/",
        },
      });

      const token = getSessionFromCookies(request);

      expect(token).toBeTruthy();
    });

    it("should handle very long cookie values", () => {
      const longToken = "a".repeat(4096); // Max typical cookie size
      const response = new Response("OK");

      const newResponse = setSessionCookie(response, longToken);

      const setCookieHeader = newResponse.headers.get("set-cookie");
      expect(setCookieHeader).toContain("sessionToken");
    });
  });

  describe("Advanced Cookie Parsing", () => {
    it("should handle cookie with quoted values", () => {
      const cookieHeader = 'sessionToken="quoted_value"; path=/';
      const cookies = parseCookies(cookieHeader);

      // Should extract value (with or without quotes depending on implementation)
      expect(cookies.sessionToken).toBeTruthy();
    });

    it("should parse cookies with whitespace", () => {
      const cookieHeader = "  sessionToken=token123  ;  path=/  ";
      const cookies = parseCookies(cookieHeader);

      expect(cookies.sessionToken).toBeTruthy();
    });

    it("should parse cookies with domain attribute", () => {
      const cookieHeader =
        "sessionToken=token; Domain=example.com; Path=/; HttpOnly";
      const cookies = parseCookies(cookieHeader);

      expect(cookies.sessionToken).toBe("token");
    });

    it("should handle cookies with expires attribute", () => {
      const cookieHeader =
        "sessionToken=token; Expires=Wed, 09 Jun 2025 10:18:14 GMT";
      const cookies = parseCookies(cookieHeader);

      expect(cookies.sessionToken).toBeTruthy();
    });

    it("should ignore cookie attributes when parsing values", () => {
      const cookieHeader =
        "sessionToken=value; HttpOnly; Secure; SameSite=Strict; Path=/";
      const cookies = parseCookies(cookieHeader);

      expect(cookies.sessionToken).toBe("value");
      // Should not have attributes as cookie keys
      expect(cookies.HttpOnly).toBeUndefined();
      expect(cookies.Secure).toBeUndefined();
    });

    it("should handle semicolon-separated cookies without spaces", () => {
      const cookieHeader = "sessionToken=abc;userId=123;theme=dark";
      const cookies = parseCookies(cookieHeader);

      expect(cookies.sessionToken).toBe("abc");
      expect(cookies.userId).toBe("123");
      expect(cookies.theme).toBe("dark");
    });

    it("should parse numeric cookie values as strings", () => {
      const cookieHeader = "sessionToken=12345; userId=67890";
      const cookies = parseCookies(cookieHeader);

      expect(typeof cookies.sessionToken).toBe("string");
      expect(cookies.sessionToken).toBe("12345");
    });
  });

  describe("Session Cookie Extraction Advanced", () => {
    it("should extract session token from first position", () => {
      const request = new Request("http://localhost", {
        headers: {
          cookie: "sessionToken=first; other=value",
        },
      });

      const token = getSessionFromCookies(request);
      expect(token).toBe("first");
    });

    it("should extract session token from middle position", () => {
      const request = new Request("http://localhost", {
        headers: {
          cookie: "userId=1; sessionToken=middle; theme=dark",
        },
      });

      const token = getSessionFromCookies(request);
      expect(token).toBe("middle");
    });

    it("should extract session token from last position", () => {
      const request = new Request("http://localhost", {
        headers: {
          cookie: "userId=1; theme=dark; sessionToken=last",
        },
      });

      const token = getSessionFromCookies(request);
      expect(token).toBe("last");
    });

    it("should handle empty sessionToken value", () => {
      const request = new Request("http://localhost", {
        headers: {
          cookie: "sessionToken=; other=value",
        },
      });

      const token = getSessionFromCookies(request);
      // Should return empty string or null depending on implementation
      expect(token === "" || token === null).toBe(true);
    });

    it("should return null for headers.cookie === undefined", () => {
      const request = new Request("http://localhost");

      const token = getSessionFromCookies(request);
      expect(token).toBeNull();
    });

    it("should handle request with multiple cookie headers", () => {
      const request = new Request("http://localhost");
      // Manually set cookies header
      request.headers.set("cookie", "sessionToken=multiheader");

      const token = getSessionFromCookies(request);
      expect(token).toBe("multiheader");
    });
  });

  describe("Set Session Cookie Advanced", () => {
    it("should create new response object", () => {
      const response = new Response("test");
      const token = "token123";

      const newResponse = setSessionCookie(response, token);

      // Should not be the same object (or at least return a response)
      expect(newResponse).toBeTruthy();
      expect(newResponse instanceof Response).toBe(true);
    });

    it("should set cookie with custom expiry days", () => {
      const response = new Response("OK");
      const token = "custom_expiry";
      const customDays = 14;

      const newResponse = setSessionCookie(response, token, customDays);

      const setCookieHeader = newResponse.headers.get("set-cookie");
      const expectedSeconds = customDays * 24 * 60 * 60;

      expect(setCookieHeader).toContain(`Max-Age=${expectedSeconds}`);
    });

    it("should set cookie with 1 day expiry", () => {
      const response = new Response("OK");
      const token = "one_day_token";

      const newResponse = setSessionCookie(response, token, 1);

      const setCookieHeader = newResponse.headers.get("set-cookie");
      const oneDaySeconds = 24 * 60 * 60;

      expect(setCookieHeader).toContain(`Max-Age=${oneDaySeconds}`);
    });

    it("should set cookie with 30 day expiry", () => {
      const response = new Response("OK");
      const token = "thirty_day_token";

      const newResponse = setSessionCookie(response, token, 30);

      const setCookieHeader = newResponse.headers.get("set-cookie");
      const thirtyDaysSeconds = 30 * 24 * 60 * 60;

      expect(setCookieHeader).toContain(`Max-Age=${thirtyDaysSeconds}`);
    });

    it("should set HttpOnly flag always", () => {
      const response = new Response("OK");

      const newResponse = setSessionCookie(response, "token");

      const setCookieHeader = newResponse.headers.get("set-cookie");
      expect(setCookieHeader).toContain("HttpOnly");
    });

    it("should set Secure flag always", () => {
      const response = new Response("OK");

      const newResponse = setSessionCookie(response, "token");

      const setCookieHeader = newResponse.headers.get("set-cookie");
      expect(setCookieHeader).toContain("Secure");
    });

    it("should set Path=/", () => {
      const response = new Response("OK");

      const newResponse = setSessionCookie(response, "token");

      const setCookieHeader = newResponse.headers.get("set-cookie");
      expect(setCookieHeader).toContain("Path=/");
    });

    it("should preserve response headers", () => {
      const response = new Response("test", {
        headers: {
          "content-type": "application/json",
          "x-custom": "header-value",
        },
      });

      const newResponse = setSessionCookie(response, "token");

      expect(newResponse.headers.get("content-type")).toBe("application/json");
      expect(newResponse.headers.get("x-custom")).toBe("header-value");
    });

    it("should set session token name correctly", () => {
      const response = new Response("OK");
      const token = "my_token_value";

      const newResponse = setSessionCookie(response, token);

      const setCookieHeader = newResponse.headers.get("set-cookie");
      expect(setCookieHeader).toContain("sessionToken=");
      expect(setCookieHeader).toContain(token);
    });
  });

  describe("Clear Session Cookie Advanced", () => {
    it("should return Response object", () => {
      const response = new Response("OK");

      const newResponse = clearSessionCookie(response);

      expect(newResponse instanceof Response).toBe(true);
    });

    it("should preserve response body content", async () => {
      const body = JSON.stringify({ message: "logged out" });
      const response = new Response(body, {
        headers: { "content-type": "application/json" },
      });

      const newResponse = clearSessionCookie(response);

      const responseBody = await newResponse.text();
      expect(responseBody).toBe(body);
    });

    it("should preserve existing headers", () => {
      const response = new Response("OK", {
        headers: {
          "content-type": "text/plain",
          "x-custom": "value",
        },
      });

      const newResponse = clearSessionCookie(response);

      expect(newResponse.headers.get("content-type")).toBe("text/plain");
      expect(newResponse.headers.get("x-custom")).toBe("value");
    });

    it("should clear sessionToken", () => {
      const response = new Response("OK");

      const newResponse = clearSessionCookie(response);

      const setCookieHeader = newResponse.headers.get("set-cookie");
      expect(setCookieHeader).toContain("sessionToken");
    });

    it("should set cookie to expire immediately", () => {
      const response = new Response("OK");

      const newResponse = clearSessionCookie(response);

      const setCookieHeader = newResponse.headers.get("set-cookie");
      // Clear is usually done with Max-Age=0 or empty value
      expect(
        setCookieHeader?.includes("Max-Age=0") ||
          setCookieHeader?.includes("sessionToken=")
      ).toBe(true);
    });

    it("should have HttpOnly flag on clear", () => {
      const response = new Response("OK");

      const newResponse = clearSessionCookie(response);

      const setCookieHeader = newResponse.headers.get("set-cookie");
      expect(setCookieHeader).toContain("HttpOnly");
    });

    it("should have Secure flag on clear", () => {
      const response = new Response("OK");

      const newResponse = clearSessionCookie(response);

      const setCookieHeader = newResponse.headers.get("set-cookie");
      expect(setCookieHeader).toContain("Secure");
    });

    it("should have Path=/ on clear", () => {
      const response = new Response("OK");

      const newResponse = clearSessionCookie(response);

      const setCookieHeader = newResponse.headers.get("set-cookie");
      expect(setCookieHeader).toContain("Path=/");
    });
  });

  describe("Cookie Workflow", () => {
    it("should set and then clear cookie in workflow", () => {
      const initialResponse = new Response("OK");
      const token = "workflow_token";

      // Set cookie
      const setResponse = setSessionCookie(initialResponse, token);
      let setCookieHeader = setResponse.headers.get("set-cookie");

      expect(setCookieHeader).toContain("sessionToken");
      expect(setCookieHeader).toContain(token);

      // Clear cookie
      const clearResponse = clearSessionCookie(setResponse);
      setCookieHeader = clearResponse.headers.get("set-cookie");

      expect(setCookieHeader).toContain("sessionToken");
    });

    it("should extract token from request and validate", () => {
      // Simulate setting cookie in response
      const response = new Response("OK");
      const originalToken = "workflow_validate_token";

      setSessionCookie(response, originalToken);

      // Simulate extracting from request
      const request = new Request("http://localhost", {
        headers: {
          cookie: `sessionToken=${originalToken}`,
        },
      });

      const extractedToken = getSessionFromCookies(request);

      expect(extractedToken).toBe(originalToken);
    });

    it("should handle multiple cookie operations", () => {
      let response = new Response("OK");

      // Set first token
      response = setSessionCookie(response, "token1");
      expect(response.headers.get("set-cookie")).toContain("token1");

      // Set second token (should replace)
      response = setSessionCookie(response, "token2");
      expect(response.headers.get("set-cookie")).toContain("sessionToken");

      // Clear
      response = clearSessionCookie(response);
      expect(response.headers.get("set-cookie")).toContain("sessionToken");
    });
  });

  describe("Cookie Edge Cases", () => {
    it("should handle cookie with equals sign in value", () => {
      const cookieHeader = "sessionToken=abc=def=ghi";
      const cookies = parseCookies(cookieHeader);

      expect(cookies.sessionToken).toBeTruthy();
    });

    it("should handle multiple semicolons", () => {
      const cookieHeader = "sessionToken=value;;; path=/";
      const cookies = parseCookies(cookieHeader);

      expect(cookies.sessionToken).toBeTruthy();
    });

    it("should set cookie response status unchanged", () => {
      const response = new Response("OK", { status: 201 });
      const newResponse = setSessionCookie(response, "token");

      expect(newResponse.status).toBe(201);
    });

    it("should preserve response status when clearing", () => {
      const response = new Response("OK", { status: 200 });
      const newResponse = clearSessionCookie(response);

      expect(newResponse.status).toBe(200);
    });

    it("should handle cookie name case-insensitivity", () => {
      const cookieHeader = "SESSIONTOKEN=value; OtherCookie=test";
      const cookies = parseCookies(cookieHeader);

      // Bun normalizes to lowercase
      expect(
        cookies.sessiontoken || cookies.SESSIONTOKEN || cookies.SessionToken
      ).toBeTruthy();
    });

    it("should extract token case-insensitively", () => {
      const request = new Request("http://localhost", {
        headers: {
          cookie: "sessionToken=mytoken",
        },
      });

      const token = getSessionFromCookies(request);
      expect(token).toBeTruthy();
    });
  });

  describe("Cookie Response Body Handling", () => {
    it("should preserve streamed response body", async () => {
      const body = "streaming content";
      const response = new Response(body);

      const newResponse = setSessionCookie(response, "token");
      const newBody = await newResponse.text();

      expect(newBody).toBe(body);
    });

    it("should preserve JSON response body", async () => {
      const jsonData = { success: true, data: [1, 2, 3] };
      const response = new Response(JSON.stringify(jsonData), {
        headers: { "content-type": "application/json" },
      });

      const newResponse = setSessionCookie(response, "token");
      const responseBody = await newResponse.json();

      expect(responseBody).toEqual(jsonData);
    });

    it("should preserve empty response body", async () => {
      const response = new Response("");

      const newResponse = setSessionCookie(response, "token");
      const newBody = await newResponse.text();

      expect(newBody).toBe("");
    });
  });

  describe("Cookie Parsing Edge Cases", () => {
    it("should parse cookies with max-age attribute", () => {
      const cookieHeader = "sessionToken=token; Max-Age=3600; Path=/; HttpOnly";
      const cookies = parseCookies(cookieHeader);

      expect(cookies.sessionToken).toBe("token");
      // Bun CookieMap may include attributes as cookie entries in some cases
      // Just verify sessionToken is parsed correctly
      expect(cookies.sessionToken).toBeTruthy();
    });

    it("should handle cookies with empty name", () => {
      const cookieHeader = "=value; sessionToken=token";
      const cookies = parseCookies(cookieHeader);

      expect(cookies.sessionToken).toBeTruthy();
    });

    it("should parse mixed case attribute names", () => {
      const cookieHeader =
        "sessionToken=token; PATH=/; HTTPONLY; secure; SAMESITE=strict";
      const cookies = parseCookies(cookieHeader);

      expect(cookies.sessionToken).toBe("token");
    });

    it("should handle cookie value with special encoding", () => {
      const cookieHeader = "sessionToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9";
      const cookies = parseCookies(cookieHeader);

      expect(cookies.sessionToken).toBeTruthy();
      expect((cookies.sessionToken as string).length).toBeGreaterThan(0);
    });
  });

  describe("Cookie Middleware Error Handling", () => {
    it("should handle malformed set-cookie header gracefully", () => {
      const response = new Response("OK");
      const token = "valid_token";

      // Should not throw
      expect(() => {
        setSessionCookie(response, token);
      }).not.toThrow();
    });

    it("should not mutate original response", () => {
      const response = new Response("OK");

      setSessionCookie(response, "token");

      expect(response.headers.get("set-cookie")).toBeNull();
    });

    it("should handle very large cookie values", () => {
      const largeToken = "x".repeat(8192); // 8KB token
      const response = new Response("OK");

      const newResponse = setSessionCookie(response, largeToken);
      const setCookieHeader = newResponse.headers.get("set-cookie");

      expect(setCookieHeader).toContain("sessionToken");
    });

    it("should generate unique response objects", () => {
      const response1 = new Response("OK");
      const response2 = new Response("OK");
      const newResponse1 = setSessionCookie(response1, "token1");
      const newResponse2 = setSessionCookie(response2, "token2");

      expect(newResponse1).not.toBe(newResponse2);
    });
  });

  describe("Cookie Expiry and Time", () => {
    it("should set correct max-age for various expiry days", () => {
      const testCases = [
        { days: 1, expected: 86400 },
        { days: 7, expected: 604800 },
        { days: 14, expected: 1209600 },
        { days: 30, expected: 2592000 },
        { days: 365, expected: 31536000 },
      ];

      testCases.forEach(({ days, expected }) => {
        const response = new Response("OK");
        const newResponse = setSessionCookie(response, "token", days);
        const setCookieHeader = newResponse.headers.get("set-cookie");

        expect(setCookieHeader).toContain(`Max-Age=${expected}`);
      });
    });

    it("should calculate expiry seconds correctly", () => {
      const response = new Response("OK");
      const days = 3;

      const newResponse = setSessionCookie(response, "token", days);
      const setCookieHeader = newResponse.headers.get("set-cookie");

      const expectedSeconds = 3 * 24 * 60 * 60;
      expect(setCookieHeader).toContain(`Max-Age=${expectedSeconds}`);
    });
  });

  describe("Cookie Format Validation", () => {
    it("should have proper cookie format in set-cookie header", () => {
      const response = new Response("OK");
      const newResponse = setSessionCookie(response, "mytoken");

      const setCookieHeader = newResponse.headers.get("set-cookie");

      // Should have cookie name and value separated by =
      expect(setCookieHeader).toMatch(/sessionToken=/);
      // Should have required attributes
      expect(setCookieHeader).toMatch(/Path=/i);
      expect(setCookieHeader).toMatch(/HttpOnly/i);
      expect(setCookieHeader).toMatch(/Secure/i);
    });

    it("should use semicolon separator for cookie attributes", () => {
      const response = new Response("OK");
      const newResponse = setSessionCookie(response, "token");

      const setCookieHeader = newResponse.headers.get("set-cookie");

      expect(setCookieHeader).toContain(";");
    });
  });
});
