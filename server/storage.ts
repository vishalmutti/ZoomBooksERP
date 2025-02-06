import { invoices, suppliers, invoiceItems, type User, type InsertUser, type Invoice, type InsertInvoice, type Supplier, type InsertSupplier } from "@shared/schema";
import { db } from "./db";
import { eq, ilike } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  getSuppliers(): Promise<Supplier[]>;
  searchSuppliers(query: string): Promise<Supplier[]>;
  createSupplier(supplier: InsertSupplier): Promise<Supplier>;
  getSupplier(id: number): Promise<Supplier | undefined>;

  getInvoices(): Promise<Invoice[]>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: number, updates: Partial<Invoice>): Promise<Invoice>;
  getInvoice(id: number): Promise<Invoice | undefined>;

  sessionStore: session.SessionStore;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.SessionStore;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getSuppliers(): Promise<Supplier[]> {
    return await db.select().from(suppliers).orderBy(suppliers.name);
  }

  async searchSuppliers(query: string): Promise<Supplier[]> {
    return await db
      .select()
      .from(suppliers)
      .where(ilike(suppliers.name, `${query}%`))
      .orderBy(suppliers.name);
  }

  async createSupplier(supplier: InsertSupplier): Promise<Supplier> {
    const [newSupplier] = await db.insert(suppliers).values(supplier).returning();
    return newSupplier;
  }

  async getSupplier(id: number): Promise<Supplier | undefined> {
    const [supplier] = await db.select().from(suppliers).where(eq(suppliers.id, id));
    return supplier;
  }

  async getInvoices(): Promise<Invoice[]> {
    return await db
      .select()
      .from(invoices)
      .orderBy(invoices.createdAt);
  }

  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    return await db.transaction(async (tx) => {
      const [newInvoice] = await tx
        .insert(invoices)
        .values({
          supplierId: invoice.supplierId,
          totalAmount: invoice.totalAmount,
          dueDate: invoice.dueDate,
          isPaid: invoice.isPaid,
          notes: invoice.notes,
          uploadedFile: invoice.uploadedFile,
        })
        .returning();

      if (invoice.items?.length) {
        await tx.insert(invoiceItems).values(
          invoice.items.map((item) => ({
            ...item,
            invoiceId: newInvoice.id,
          }))
        );
      }

      return newInvoice;
    });
  }

  async updateInvoice(id: number, updates: Partial<Invoice>): Promise<Invoice> {
    const [invoice] = await db
      .update(invoices)
      .set(updates)
      .where(eq(invoices.id, id))
      .returning();

    if (!invoice) throw new Error('Invoice not found');
    return invoice;
  }

  async getInvoice(id: number): Promise<Invoice | undefined> {
    const [invoice] = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, id));
    return invoice;
  }
}

export const storage = new DatabaseStorage();