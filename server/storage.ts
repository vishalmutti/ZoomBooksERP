import { invoices, type User, type InsertUser, type Invoice, type InsertInvoice } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getInvoices(): Promise<Invoice[]>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: number, updates: Partial<Invoice>): Promise<Invoice>;
  getInvoice(id: number): Promise<Invoice | undefined>;
  
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private invoices: Map<number, Invoice>;
  private userIdCounter: number;
  private invoiceIdCounter: number;
  sessionStore: session.SessionStore;

  constructor() {
    this.users = new Map();
    this.invoices = new Map();
    this.userIdCounter = 1;
    this.invoiceIdCounter = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getInvoices(): Promise<Invoice[]> {
    return Array.from(this.invoices.values());
  }

  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    const id = this.invoiceIdCounter++;
    const newInvoice: Invoice = { ...invoice, id };
    this.invoices.set(id, newInvoice);
    return newInvoice;
  }

  async updateInvoice(id: number, updates: Partial<Invoice>): Promise<Invoice> {
    const invoice = this.invoices.get(id);
    if (!invoice) throw new Error('Invoice not found');
    
    const updatedInvoice = { ...invoice, ...updates };
    this.invoices.set(id, updatedInvoice);
    return updatedInvoice;
  }

  async getInvoice(id: number): Promise<Invoice | undefined> {
    return this.invoices.get(id);
  }
}

export const storage = new MemStorage();
