
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "@shared/schema";
import SQLiteStore from "better-sqlite3-session-store";
import session from "express-session";
import { and, eq } from "drizzle-orm";

const db = new Database("sqlite.db");
const SessionStore = SQLiteStore(session);
const sessionStore = new SessionStore({
  client: db,
  expired: {
    clear: true,
    intervalMs: 900000
  }
});

class DatabaseStorage {
  db = drizzle(db, { schema });
  sessionStore = sessionStore;

  async getUser(id: number) {
    const [user] = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, id));
    return user;
  }

  async getUserByUsername(username: string) {
    const [user] = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.username, username));
    return user;
  }

  async createUser(data: any) {
    const [user] = await this.db
      .insert(schema.users)
      .values(data)
      .returning();
    return user;
  }

  async getAllSuppliers() {
    return await this.db.select().from(schema.suppliers);
  }
}

export const storage = new DatabaseStorage();
