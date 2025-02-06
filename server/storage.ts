import { invoices, suppliers, invoiceItems, users, payments, type User, type InsertUser, type Invoice, type InsertInvoice, type Supplier, type InsertSupplier, type Payment, type InsertPayment, type InvoiceItem } from "@shared/schema";
import { db } from "./db";
import { eq, ilike, and, gte, lte, sql, desc } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

interface InvoiceFilters {
  startDate?: Date;
  endDate?: Date;
  isPaid?: boolean;
  minAmount?: number;
  maxAmount?: number;
  supplierId?: number;
}

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  getSuppliers(): Promise<(Supplier & { outstandingAmount: string })[]>;
  searchSuppliers(query: string): Promise<Supplier[]>;
  createSupplier(supplier: InsertSupplier): Promise<Supplier>;
  updateSupplier(id: number, updates: Partial<InsertSupplier>): Promise<Supplier | undefined>;
  getSupplier(id: number): Promise<(Supplier & { outstandingAmount: string }) | undefined>;
  getSupplierInvoices(supplierId: number): Promise<Invoice[]>;
  deleteSupplier(id: number): Promise<void>;

  getInvoices(filters?: InvoiceFilters): Promise<Invoice[]>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: number, updates: Partial<Invoice>): Promise<Invoice>;
  getInvoice(id: number): Promise<(Invoice & { items?: InvoiceItem[] }) | undefined>;
  deleteInvoice(id: number): Promise<void>;

  createPayment(payment: InsertPayment): Promise<Payment>;
  getInvoicePayments(invoiceId: number): Promise<Payment[]>;

  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

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

  async getSuppliers(): Promise<(Supplier & { outstandingAmount: string })[]> {
    const result = await db
      .select({
        id: suppliers.id,
        name: suppliers.name,
        email: suppliers.email,
        address: suppliers.address,
        contactPerson: suppliers.contactPerson,
        phone: suppliers.phone,
        createdAt: suppliers.createdAt,
        outstandingAmount: sql<string>`COALESCE(
          SUM(CASE WHEN ${invoices.isPaid} = false THEN ${invoices.totalAmount}::numeric ELSE 0 END),
          0
        )::text`
      })
      .from(suppliers)
      .leftJoin(invoices, eq(invoices.supplierId, suppliers.id))
      .groupBy(suppliers.id)
      .orderBy(desc(sql`COALESCE(
        SUM(CASE WHEN ${invoices.isPaid} = false THEN ${invoices.totalAmount}::numeric ELSE 0 END),
        0
      )`));
    return result;
  }

  async searchSuppliers(query: string): Promise<Supplier[]> {
    return await db
      .select()
      .from(suppliers)
      .where(ilike(suppliers.name, `%${query}%`))
      .orderBy(suppliers.name);
  }

  async createSupplier(supplier: InsertSupplier): Promise<Supplier> {
    const [newSupplier] = await db.insert(suppliers).values(supplier).returning();
    return newSupplier;
  }

  async updateSupplier(id: number, updates: Partial<InsertSupplier>): Promise<Supplier | undefined> {
    const [supplier] = await db
      .update(suppliers)
      .set(updates)
      .where(eq(suppliers.id, id))
      .returning();
    return supplier;
  }

  async getSupplier(id: number): Promise<(Supplier & { outstandingAmount: string }) | undefined> {
    const [result] = await db
      .select({
        id: suppliers.id,
        name: suppliers.name,
        email: suppliers.email,
        address: suppliers.address,
        contactPerson: suppliers.contactPerson,
        phone: suppliers.phone,
        createdAt: suppliers.createdAt,
        outstandingAmount: sql<string>`COALESCE(
          SUM(CASE WHEN ${invoices.isPaid} = false THEN ${invoices.totalAmount}::numeric ELSE 0 END),
          0
        )::text`
      })
      .from(suppliers)
      .leftJoin(invoices, eq(invoices.supplierId, suppliers.id))
      .where(eq(suppliers.id, id))
      .groupBy(suppliers.id);
    return result;
  }

  async getSupplierInvoices(supplierId: number): Promise<Invoice[]> {
    return await db
      .select()
      .from(invoices)
      .where(eq(invoices.supplierId, supplierId))
      .orderBy(sql`${invoices.isPaid}, ${invoices.dueDate} DESC`);
  }

  async deleteSupplier(id: number): Promise<void> {
    await db.delete(suppliers).where(eq(suppliers.id, id));
  }

  async getInvoices(filters?: InvoiceFilters): Promise<Invoice[]> {
    let conditions = [];

    if (filters?.startDate) {
      conditions.push(gte(invoices.dueDate, filters.startDate.toISOString()));
    }
    if (filters?.endDate) {
      conditions.push(lte(invoices.dueDate, filters.endDate.toISOString()));
    }
    if (filters?.isPaid !== undefined) {
      conditions.push(eq(invoices.isPaid, filters.isPaid));
    }
    if (filters?.minAmount !== undefined) {
      conditions.push(gte(invoices.totalAmount, filters.minAmount.toString()));
    }
    if (filters?.maxAmount !== undefined) {
      conditions.push(lte(invoices.totalAmount, filters.maxAmount.toString()));
    }
    if (filters?.supplierId !== undefined) {
      conditions.push(eq(invoices.supplierId, filters.supplierId));
    }

    const query = conditions.length > 0
      ? db.select().from(invoices).where(and(...conditions)).orderBy(invoices.createdAt)
      : db.select().from(invoices).orderBy(invoices.createdAt);

    return await query;
  }

  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    return await db.transaction(async (tx) => {
      const [newInvoice] = await tx
        .insert(invoices)
        .values({
          supplierId: invoice.supplierId,
          invoiceNumber: invoice.invoiceNumber,
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
    try {
      const [invoice] = await db
        .update(invoices)
        .set({
          ...updates,
          // Ensure dates are properly formatted
          dueDate: updates.dueDate ? new Date(updates.dueDate).toISOString() : undefined,
          paymentDate: updates.paymentDate ? new Date(updates.paymentDate).toISOString() : undefined,
          // Ensure other fields are properly typed
          totalAmount: updates.totalAmount?.toString(),
          isPaid: updates.isPaid ?? false,
        })
        .where(eq(invoices.id, id))
        .returning();

      if (!invoice) {
        throw new Error('Invoice not found');
      }

      return invoice;
    } catch (error) {
      console.error('Error updating invoice:', error);
      throw error;
    }
  }

  async getInvoice(id: number): Promise<(Invoice & { items?: InvoiceItem[] }) | undefined> {
    console.log(`Fetching invoice with ID: ${id}`);
    // First, get the invoice
    const [invoice] = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, id));

    if (!invoice) {
      console.log('No invoice found with ID:', id);
      return undefined;
    }

    console.log('Found invoice:', invoice);

    // Then, get all items for this invoice
    const items = await db
      .select()
      .from(invoiceItems)
      .where(eq(invoiceItems.invoiceId, id))
      .orderBy(invoiceItems.id);

    console.log('Found invoice items:', items);

    return {
      ...invoice,
      items: items
    };
  }

  async deleteInvoice(id: number): Promise<void> {
    await db.transaction(async (tx) => {
      await tx.delete(invoiceItems).where(eq(invoiceItems.invoiceId, id));
      await tx.delete(invoices).where(eq(invoices.id, id));
    });
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [newPayment] = await db.insert(payments).values(payment).returning();
    return newPayment;
  }

  async getInvoicePayments(invoiceId: number): Promise<Payment[]> {
    return await db
      .select()
      .from(payments)
      .where(eq(payments.invoiceId, invoiceId))
      .orderBy(payments.paymentDate);
  }
}

export const storage = new DatabaseStorage();