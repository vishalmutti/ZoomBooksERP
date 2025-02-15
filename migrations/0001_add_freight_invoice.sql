
-- Keep existing tables and data
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "freight_invoice_file" text;

-- Preserve notes column in supplier_contacts
ALTER TABLE "supplier_contacts" 
  ADD COLUMN IF NOT EXISTS "notes" text;
