import { Database } from "bun:sqlite";

interface UserIdRow {
  id: number;
}

interface UserAuthRow {
  id: number;
  password_hash: string;
}

interface SessionRow {
  user_id: number;
  expires_at: string;
}

interface UserInfoRow {
  id: number;
  username: string;
  email: string;
  created_at: string;
}

const authDb = new Database(Bun.env.BUN_PUBLIC_AUTH_DB_PATH);

// Initialize SQLite database with users and sessions tables
export function initializeAuthDatabase() {
  authDb.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create sessions table for cookie-based authentication
  authDb.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      session_token TEXT UNIQUE NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      expires_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);
}

// Hash password using bcrypt algorithm for secure storage
export function hashPassword(password: string): string {
  return Bun.password.hashSync(password, {
    algorithm: "bcrypt",
    cost: 4,
  });
}

// Verify that a plain text password matches a bcrypt hash
export function verifyPassword(password: string, hash: string): boolean {
  try {
    return Bun.password.verifySync(password, hash);
  } catch (error) {
    console.error("Password verification error:", error);
    return false;
  }
}

// Generate a unique, cryptographically secure session token
export function generateSessionToken(): string {
  return Buffer.from(
    Bun.randomUUIDv7().split("-").join("") + Date.now().toString()
  ).toString("hex");
}

// Register a new user with validation and store in database
export function registerUser(
  username: string,
  email: string,
  password: string
): { success: boolean; message: string; userId?: number } {
  try {
    // Validate input
    if (!username || !email || !password) {
      return {
        success: false,
        message: "Username, email, and password are required",
      };
    }

    if (password.length < 6) {
      return {
        success: false,
        message: "Password must be at least 6 characters long",
      };
    }

    // Check if user already exists
    const existing = authDb
      .query("SELECT id FROM users WHERE email = ?")
      .get(email) as UserIdRow | undefined;
    if (existing) {
      return { success: false, message: "Email already registered" };
    }

    const passwordHash = hashPassword(password);
    const stmt = authDb.prepare(
      "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)"
    );
    stmt.run(username, email, passwordHash);

    // Get the inserted user's ID
    const user = authDb
      .query("SELECT id FROM users WHERE email = ?")
      .get(email) as UserIdRow | undefined;

    return {
      success: true,
      message: "User registered successfully",
      userId: user?.id,
    };
  } catch (error) {
    return {
      success: false,
      message: `Registration failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    };
  }
}

// Authenticate user with email and password, create session token if valid
export function authenticateUser(
  email: string,
  password: string
): {
  success: boolean;
  message: string;
  sessionToken?: string;
  userId?: number;
} {
  try {
    // Find user by email
    const user = authDb
      .query("SELECT id, password_hash FROM users WHERE email = ?")
      .get(email) as UserAuthRow | undefined;

    if (!user) {
      return { success: false, message: "Invalid email or password" };
    }

    const isValid = verifyPassword(password, user.password_hash);
    if (!isValid) {
      return { success: false, message: "Invalid email or password" };
    }

    const sessionToken = generateSessionToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const sessionStmt = authDb.prepare(
      "INSERT INTO sessions (user_id, session_token, expires_at) VALUES (?, ?, ?)"
    );
    sessionStmt.run(user.id, sessionToken, expiresAt.toISOString());

    return {
      success: true,
      message: "Authentication successful",
      sessionToken,
      userId: user.id,
    };
  } catch (error) {
    return {
      success: false,
      message: `Authentication failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    };
  }
}

// Validate session token and return associated user ID if valid and not expired
export function verifySession(sessionToken: string): {
  valid: boolean;
  userId?: number;
} {
  try {
    const session = authDb
      .query(
        `SELECT user_id, expires_at FROM sessions 
         WHERE session_token = ? AND expires_at > datetime('now')`
      )
      .get(sessionToken) as SessionRow | undefined;

    if (!session) {
      return { valid: false };
    }

    return { valid: true, userId: session.user_id };
  } catch (error) {
    return { valid: false };
  }
}

// Retrieve user information (id, username, email, created_at) by user ID
export function getUserById(userId: number): {
  id: number;
  username: string;
  email: string;
  created_at: string;
} | null {
  try {
    return authDb
      .query("SELECT id, username, email, created_at FROM users WHERE id = ?")
      .get(userId) as UserInfoRow | null;
  } catch (error) {
    return null;
  }
}

// Delete session token to logout user and invalidate session
export function logoutUser(sessionToken: string): { success: boolean } {
  try {
    authDb
      .prepare("DELETE FROM sessions WHERE session_token = ?")
      .run(sessionToken);
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}
