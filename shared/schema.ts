import { pgTable, text, serial, integer, boolean, date, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  clientName: text("client_name").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  dueDate: date("due_date").notNull(),
  isPaid: boolean("is_paid").default(false).notNull(),
  paymentDate: date("payment_date"),
  notes: text("notes"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  paymentDate: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
