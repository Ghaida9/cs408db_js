import { COOKIE_NAME, ONE_YEAR_MS } from "../../shared/const.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getDb } from "../db.js";
import { users } from "../../drizzle/schema.js";
import { eq } from "drizzle-orm";
import { getSessionCookieOptions } from "./cookies.js";

const JWT_SECRET = process.env.JWT_SECRET || "mysecretkey123456789abcdefghijk";

export function registerOAuthRoutes(app) {
  // Register
  app.post("/api/auth/register", async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      res.status(400).json({ error: "Username and password are required" });
      return;
    }
    try {
      const db = await getDb();
      if (!db) {
        res.status(500).json({ error: "Database not available" });
        return;
      }
      const existing = await db
        .select()
        .from(users)
        .where(eq(users.openId, username))
        .limit(1);
      if (existing.length > 0) {
        res.status(400).json({ error: "Username already taken" });
        return;
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      await db.insert(users).values({
        openId: username,
        name: username,
        password: hashedPassword,
      });
      const token = jwt.sign({ openId: username }, JWT_SECRET, {
        expiresIn: "1y",
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.json({ success: true });
    } catch (error) {
      console.error("[Auth] Register failed", error);
      res.status(500).json({ error: "Registration failed" });
    }
  });

  // Login
  app.post("/api/auth/login", async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      res.status(400).json({ error: "Username and password are required" });
      return;
    }
    try {
      const db = await getDb();
      if (!db) {
        res.status(500).json({ error: "Database not available" });
        return;
      }
      const result = await db
        .select()
        .from(users)
        .where(eq(users.openId, username))
        .limit(1);
      const user = result[0];
      if (!user || !user.password) {
        res.status(401).json({ error: "Invalid username or password" });
        return;
      }
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        res.status(401).json({ error: "Invalid username or password" });
        return;
      }
      const token = jwt.sign({ openId: username }, JWT_SECRET, {
        expiresIn: "1y",
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.json({ success: true });
    } catch (error) {
      console.error("[Auth] Login failed", error);
      res.status(500).json({ error: "Login failed" });
    }
  });
}
