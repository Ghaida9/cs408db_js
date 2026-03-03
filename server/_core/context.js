import jwt from "jsonwebtoken";
import { getDb } from "../db.js";
import { users } from "../../drizzle/schema.js";
import { eq } from "drizzle-orm";
import { COOKIE_NAME } from "../../shared/const.js";

const JWT_SECRET = process.env.JWT_SECRET || "mysecretkey123456789abcdefghijk";

export async function createContext(opts) {
  let user = null;
  try {
    const token = opts.req.cookies?.[COOKIE_NAME];
    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET);
      const db = await getDb();
      if (db) {
        const result = await db
          .select()
          .from(users)
          .where(eq(users.openId, decoded.openId))
          .limit(1);
        user = result[0] ?? null;
      }
    }
  } catch {
    user = null;
  }
  return { req: opts.req, res: opts.res, user };
}
