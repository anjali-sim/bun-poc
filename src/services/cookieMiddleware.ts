import { verifySession, getUserById } from "./authService";

interface UserInfo {
  id: number;
  username: string;
  email: string;
  created_at: string;
}

// Get session token from request cookies using Bun.CookieMap
export function getSessionFromCookies(req: Request): string | null {
  const cookieHeader = req.headers.get("cookie");
  if (!cookieHeader) return null;

  // Use Bun.CookieMap to parse cookies
  const cookies = new Bun.CookieMap(cookieHeader);
  return cookies.get("sessionToken") || null;
}

// Parse cookies from cookie header using Bun.CookieMap
export function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies = new Bun.CookieMap(cookieHeader);
  return cookies.toJSON();
}

// Set session cookie in response using Bun.Cookie
export function setSessionCookie(
  response: Response,
  sessionToken: string,
  expiryDays: number = 7
): Response {
  const cookie = new Bun.Cookie("sessionToken", sessionToken, {
    path: "/",
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: expiryDays * 24 * 60 * 60,
  });

  const newResponse = new Response(response.body, response);

  newResponse.headers.set("Set-Cookie", cookie.toString());

  return newResponse;
}

//  Clear session cookie using Bun.Cookie
export function clearSessionCookie(response: Response): Response {
  const cookie = new Bun.Cookie("sessionToken", "", {
    path: "/",
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: 0,
  });

  const newResponse = new Response(response.body, response);

  newResponse.headers.set("Set-Cookie", cookie.toString());

  return newResponse;
}

// Optional middleware - doesn't block but passes user info if authenticated
export function withOptionalAuthentication(
  handler: (
    req: Request,
    userId?: number,
    userInfo?: UserInfo | null
  ) => Promise<Response>
) {
  return async (req: Request): Promise<Response> => {
    const sessionToken = getSessionFromCookies(req);

    if (!sessionToken) {
      return handler(req, undefined, undefined);
    }

    const sessionResult = verifySession(sessionToken);

    if (!sessionResult.valid || !sessionResult.userId) {
      return handler(req, undefined, undefined);
    }

    const userInfo = getUserById(sessionResult.userId);
    return handler(req, sessionResult.userId, userInfo);
  };
}
