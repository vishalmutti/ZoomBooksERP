import { invoices, suppliers, invoiceItems, users, payments, incomingLoads, freightInvoices, supplierContacts, type User, type InsertUser, type Invoice, type InsertInvoice, type Supplier, type InsertSupplier, type Payment, type InsertPayment, type InvoiceItem, type IncomingLoad, type InsertIncomingLoad, type FreightInvoice, type InsertFreightInvoice, type SupplierContact } from "@shared/schema";
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
  getSupplier(id: number): Promise<(Supplier & { outstandingAmount: string, contacts: SupplierContact[] }) | undefined>;
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

  getLoads(): Promise<IncomingLoad[]>;
  getLoad(id: number): Promise<(IncomingLoad & { freightInvoices?: FreightInvoice[] }) | undefined>;
  createLoad(load: InsertIncomingLoad): Promise<IncomingLoad>;
  updateLoad(id: number, updates: Partial<IncomingLoad>): Promise<IncomingLoad>;
  deleteLoad(id: number): Promise<void>;
  getLoadFreightInvoices(loadId: number): Promise<FreightInvoice[]>;
  createFreightInvoice(freightInvoice: InsertFreightInvoice): Promise<FreightInvoice>;
  updateFreightInvoice(id: number, updates: Partial<FreightInvoice>): Promise<FreightInvoice>;
  deleteFreightInvoice(id: number): Promise<void>;
  getSupplierContacts(supplierId: number): Promise<SupplierContact[]>;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
      tableName: 'session',
      ttl: 86400,
      retry: {
        retries: 5,
        factor: 2,
        minTimeout: 1000,
        maxTimeout: 5000
      }
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
    return await db.transaction(async (tx) => {
      const [newSupplier] = await tx.insert(suppliers).values({
        name: supplier.name,
        address: supplier.address,
        contactPerson: supplier.contactPerson,
        email: supplier.email,
        phone: supplier.phone,
      }).returning();

      if (supplier.contacts?.length) {
        await tx.insert(supplierContacts).values(
          supplier.contacts.map(contact => ({
            ...contact,
            supplierId: newSupplier.id,
          }))
        );
      }

      return newSupplier;
    });
  }

  async updateSupplier(id: number, updates: Partial<InsertSupplier>): Promise<(Supplier & { outstandingAmount: string, contacts: SupplierContact[] }) | undefined> {
    return await db.transaction(async (tx) => {
      await tx
        .update(suppliers)
        .set({
          name: updates.name,
          address: updates.address,
          contactPerson: updates.contactPerson,
          email: updates.email,
          phone: updates.phone,
        })
        .where(eq(suppliers.id, id));

      if (updates.contacts) {
        await tx.delete(supplierContacts).where(eq(supplierContacts.supplierId, id));

        if (updates.contacts.length > 0) {
          await tx.insert(supplierContacts).values(
            updates.contacts.map(contact => ({
              name: contact.name,
              email: contact.email,
              phone: contact.phone,
              isPrimary: contact.isPrimary,
              supplierId: id,
            }))
          );
        }
      }

      // Return the updated supplier using getSupplier
      return await this.getSupplier(id);
    });
  }

  async getSupplier(id: number): Promise<(Supplier & { outstandingAmount: string, contacts: SupplierContact[] }) | undefined> {
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
    if (!result) return undefined;

    // Fetch the supplier's contacts
    const contacts = await db
      .select()
      .from(supplierContacts)
      .where(eq(supplierContacts.supplierId, id))
      .orderBy(supplierContacts.createdAt);

    return { ...result, contacts };
  }

  async getSupplierInvoices(supplierId: number): Promise<Invoice[]> {
    return await db
      .select()
      .from(invoices)
      .where(eq(invoices.supplierId, supplierId))
      .orderBy(sql`${invoices.isPaid}, ${invoices.dueDate} DESC`);
  }

  async deleteSupplier(id: number): Promise<void> {
    await db.transaction(async (tx) => {
      // Get all loads for this supplier
      const loads = await tx
        .select({ id: incomingLoads.id })
        .from(incomingLoads)
        .where(eq(incomingLoads.supplierId, id.toString()));

      // Delete freight invoices for each load
      for (const load of loads) {
        await tx.delete(freightInvoices).where(eq(freightInvoices.loadId, load.id));
      }

      // Delete loads
      await tx.delete(incomingLoads).where(eq(incomingLoads.supplierId, id.toString()));

      // Delete supplier's contacts
      await tx.delete(supplierContacts).where(eq(supplierContacts.supplierId, id));

      // Finally delete the supplier
      await tx.delete(suppliers).where(eq(suppliers.id, id));
    });
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

    const invoices = await query;
      // Map old currency field to new amountCurrency field for backward compatibility
      return invoices.map(invoice => ({
        ...invoice,
        currency: invoice.amountCurrency
      }));
  }

  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    return await db.transaction(async (tx) => {
      const [newInvoice] = await tx
        .insert(invoices)
        .values({
          supplierId: invoice.supplierId,
          invoiceNumber: invoice.invoiceNumber,
          carrier: invoice.carrier,
          totalAmount: invoice.totalAmount,
          freightCost: invoice.freightCost,
          amountCurrency: invoice.amountCurrency,
          freightCostCurrency: invoice.freightCostCurrency,
          dueDate: invoice.dueDate,
          isPaid: invoice.isPaid,
          notes: invoice.notes,
          uploadedFile: invoice.uploadedFile,
          bolFile: invoice.bolFile,
          freightInvoiceFile: invoice.freightInvoiceFile,
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
          freightCost: updates.freightCost?.toString(),
          isPaid: updates.isPaid ?? false,
          bolFile: updates.bolFile === undefined ?
            (await this.getInvoice(id))?.bolFile :
            updates.bolFile,
          freightInvoiceFile: updates.freightInvoiceFile === undefined ?
            (await this.getInvoice(id))?.freightInvoiceFile :
            updates.freightInvoiceFile
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


  async getLoads() {
    return await db
      .select()
      .from(incomingLoads)
      .orderBy(desc(incomingLoads.createdAt));
  }

  async getLoad(id: number): Promise<(IncomingLoad & { freightInvoices?: FreightInvoice[] }) | undefined> {
    const [load] = await db
      .select()
      .from(incomingLoads)
      .where(eq(incomingLoads.id, id));

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

  async createLoad(load: InsertIncomingLoad): Promise<IncomingLoad> {
    const [newLoad] = await db
      .insert(incomingLoads)
      .values({
        supplierId: load.supplierId,
        loadType: load.loadType,
        referenceNumber: load.referenceNumber,
        location: load.location,
        notes: load.notes,
        loadCost: load.loadCost,
        freightCost: load.freightCost,
        profitRoi: load.profitRoi,
        status: load.status ?? 'Pending',
        scheduledPickup: load.scheduledPickup ? new Date(load.scheduledPickup).toISOString() : null,
        scheduledDelivery: load.scheduledDelivery ? new Date(load.scheduledDelivery).toISOString() : null,
        carrier: load.carrier,
        bolFile: load.bolFile,
        materialInvoiceFile: load.materialInvoiceFile,
        freightInvoiceFile: load.freightInvoiceFile,
        loadPerformanceFile: load.loadPerformanceFile,
        materialInvoiceStatus: load.materialInvoiceStatus ?? 'UNPAID',
        freightInvoiceStatus: load.freightInvoiceStatus ?? 'UNPAID',
        freightCostCurrency: load.freightCostCurrency
      })
      .returning();
    return newLoad;
  }

  async updateLoad(id: number, updates: Partial<IncomingLoad>): Promise<IncomingLoad> {
    try {
      return await db.transaction(async (tx) => {
        console.log('Updating load:', id, 'with data:', updates);
        const updateData: Partial<IncomingLoad> = {};

        // Only include fields that are actually present in the updates object
        if (updates.scheduledPickup !== undefined) {
          updateData.scheduledPickup = updates.scheduledPickup ? new Date(updates.scheduledPickup).toISOString() : null;
        }
        if (updates.scheduledDelivery !== undefined) {
          updateData.scheduledDelivery = updates.scheduledDelivery ? new Date(updates.scheduledDelivery).toISOString() : null;
        }
        if (updates.loadType !== undefined) updateData.loadType = updates.loadType;
        if (updates.supplierId !== undefined) updateData.supplierId = updates.supplierId;
        if (updates.referenceNumber !== undefined) updateData.referenceNumber = updates.referenceNumber;
        if (updates.location !== undefined) updateData.location = updates.location;
        if (updates.notes !== undefined) updateData.notes = updates.notes;
        if (updates.loadCost !== undefined) {
          updateData.loadCost = typeof updates.loadCost === 'string'
            ? updates.loadCost
            : updates.loadCost.toString();
        }
        if (updates.freightCost !== undefined) {
          updateData.freightCost = typeof updates.freightCost === 'string'
            ? updates.freightCost
            : updates.freightCost.toString();
        }
        if (updates.profitRoi !== undefined) {
          updateData.profitRoi = typeof updates.profitRoi === 'string'
            ? updates.profitRoi
            : updates.profitRoi.toString();
        }
        if (updates.status !== undefined) updateData.status = updates.status;
        if (updates.carrier !== undefined) updateData.carrier = updates.carrier;
        if (updates.materialInvoiceStatus !== undefined) updateData.materialInvoiceStatus = updates.materialInvoiceStatus;
        if (updates.freightInvoiceStatus !== undefined) updateData.freightInvoiceStatus = updates.freightInvoiceStatus;
        if (updates.bolFile !== undefined) updateData.bolFile = updates.bolFile;
        if (updates.materialInvoiceFile !== undefined) updateData.materialInvoiceFile = updates.materialInvoiceFile;
        if (updates.freightInvoiceFile !== undefined) updateData.freightInvoiceFile = updates.freightInvoiceFile;
        if (updates.loadPerformanceFile !== undefined) updateData.loadPerformanceFile = updates.loadPerformanceFile;
        if (updates.freightCostCurrency !== undefined) updateData.freightCostCurrency = updates.freightCostCurrency;


        // Get the current load data
        const [currentLoad] = await db
          .select()
          .from(incomingLoads)
          .where(eq(incomingLoads.id, id));

        if (!currentLoad) {
          throw new Error('Load not found');
        }

        // Merge current data with updates to ensure we have all required fields
        const mergedData = {
          ...currentLoad,
          ...updateData
        };

        console.log('Updating load with data:', mergedData);

        const [updatedLoad] = await tx
          .update(incomingLoads)
          .set(mergedData)
          .where(eq(incomingLoads.id, id))
          .returning();

        if (!updatedLoad) {
          throw new Error('Failed to update load');
        }

        const result = await tx
          .select()
          .from(incomingLoads)
          .where(eq(incomingLoads.id, id))
          .execute();

        console.log('Load updated successfully:', result[0]);
        return result[0];
      });
    } catch (error) {
      console.error('Error updating load:', error);
      throw error;
    }
  }

  async deleteLoad(id: number): Promise<void> {
    await db.transaction(async (tx) => {
      await tx.delete(freightInvoices).where(eq(freightInvoices.loadId, id));
      await tx.delete(incomingLoads).where(eq(incomingLoads.id, id));
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
    try {
      await db.transaction(async (tx) => {
        const [freightInvoice] = await tx
          .select()
          .from(freightInvoices)
          .where(eq(freightInvoices.id, id));

        if (!freightInvoice) {
          throw new Error('Freight invoice not found');
        }

        await tx.delete(freightInvoices).where(eq(freightInvoices.id, id));
      });
    } catch (error) {
      console.error('Error deleting freight invoice:', error);
      throw error;
    }
  }

  async getSupplierContacts(supplierId: number): Promise<SupplierContact[]> {
    return await db
      .select()
      .from(supplierContacts)
      .where(eq(supplierContacts.supplierId, supplierId))
      .orderBy(supplierContacts.createdAt);
  }
}

export const storage = new DatabaseStorage();