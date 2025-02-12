import { invoices, suppliers, invoiceItems, users, payments, type User, type InsertUser, type Invoice, type InsertInvoice, type Supplier, type InsertSupplier, type Payment, type InsertPayment, type InvoiceItem } from "@shared/schema";
import { loads, freightInvoices, type Load, type InsertLoad, type FreightInvoice, type InsertFreightInvoice } from "@shared/schema";
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

  getLoads(): Promise<Load[]>;
  getLoad(id: number): Promise<(Load & { freightInvoices?: FreightInvoice[] }) | undefined>;
  createLoad(load: InsertLoad): Promise<Load>;
  updateLoad(id: number, updates: Partial<Load>): Promise<Load>;
  deleteLoad(id: number): Promise<void>;
  getLoadFreightInvoices(loadId: number): Promise<FreightInvoice[]>;
  createFreightInvoice(freightInvoice: InsertFreightInvoice): Promise<FreightInvoice>;
  updateFreightInvoice(id: number, updates: Partial<FreightInvoice>): Promise<FreightInvoice>;
  deleteFreightInvoice(id: number): Promise<void>;
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
          dueDate: updates.dueDate ? new Date(updates.dueDate).toISOString() : undefined,
          paymentDate: updates.paymentDate ? new Date(updates.paymentDate).toISOString() : undefined,
          totalAmount: updates.totalAmount?.toString(),
          isPaid: updates.isPaid ?? false,
          bolFile: updates.bolFile === undefined ?
            (await this.getInvoice(id))?.bolFile :
            updates.bolFile
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
    const [invoice] = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, id));

    if (!invoice) return undefined;

    const items = await db
      .select()
      .from(invoiceItems)
      .where(eq(invoiceItems.invoiceId, id));

    return {
      ...invoice,
      items
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


  async getLoads(): Promise<Load[]> {
    const results = await db.select({
      id: loads.id,
      loadId: loads.loadId,
      loadType: loads.loadType,
      status: loads.status,
      notes: loads.notes,
      pickupLocation: loads.pickupLocation,
      deliveryLocation: loads.deliveryLocation,
      scheduledPickup: loads.scheduledPickup,
      scheduledDelivery: loads.scheduledDelivery,
      actualPickup: loads.actualPickup,
      actualDelivery: loads.actualDelivery,
      carrier: loads.carrier,
      driverName: loads.driverName,
      driverPhone: loads.driverPhone,
      equipment: loads.equipment,
      freightCost: loads.freightCost,
      poNumber: loads.poNumber,
      orderNumber: loads.orderNumber,
      brokerName: loads.brokerName,
      brokerContact: loads.brokerContact,
      containerNumber: loads.containerNumber,
      bookingNumber: loads.bookingNumber,
      vesselName: loads.vesselName,
      voyageNumber: loads.voyageNumber,
      estimatedPortArrival: loads.estimatedPortArrival,
      actualPortArrival: loads.actualPortArrival,
      customsClearanceDate: loads.customsClearanceDate,
      referenceNumber: loads.referenceNumber,
      warehouseLocation: loads.warehouseLocation,
      handlingInstructions: loads.handlingInstructions,
      createdAt: loads.createdAt
    })
    .from(loads)
    .orderBy(loads.createdAt);
    
    return results;
  }

  async getLoad(id: number): Promise<(Load & { freightInvoices?: FreightInvoice[] }) | undefined> {
    const [load] = await db.select().from(loads).where(eq(loads.id, id));
    if (!load) return undefined;

    const loadFreightInvoices = await db
      .select()
      .from(freightInvoices)
      .where(eq(freightInvoices.loadId, id));

    return {
      ...load,
      freightInvoices: loadFreightInvoices,
    };
  }

  async createLoad(load: InsertLoad): Promise<Load> {
    const [newLoad] = await db.insert(loads).values(load).returning();
    return newLoad;
  }

  async updateLoad(id: number, updates: Partial<Load>): Promise<Load> {
    const [updatedLoad] = await db
      .update(loads)
      .set(updates)
      .where(eq(loads.id, id))
      .returning();
    return updatedLoad;
  }

  async deleteLoad(id: number): Promise<void> {
    await db.transaction(async (tx) => {
      await tx.delete(freightInvoices).where(eq(freightInvoices.loadId, id));
      await tx.delete(loads).where(eq(loads.id, id));
    });
  }

  async getLoadFreightInvoices(loadId: number): Promise<FreightInvoice[]> {
    return await db
      .select()
      .from(freightInvoices)
      .where(eq(freightInvoices.loadId, loadId))
      .orderBy(freightInvoices.createdAt);
  }

  async createFreightInvoice(freightInvoice: InsertFreightInvoice): Promise<FreightInvoice> {
    const [newFreightInvoice] = await db
      .insert(freightInvoices)
      .values(freightInvoice)
      .returning();
    return newFreightInvoice;
  }

  async updateFreightInvoice(id: number, updates: Partial<FreightInvoice>): Promise<FreightInvoice> {
    const [updatedFreightInvoice] = await db
      .update(freightInvoices)
      .set(updates)
      .where(eq(freightInvoices.id, id))
      .returning();
    return updatedFreightInvoice;
  }

  async deleteFreightInvoice(id: number): Promise<void> {
    await db.delete(freightInvoices).where(eq(freightInvoices.id, id));
  }
}

export const storage = new DatabaseStorage();