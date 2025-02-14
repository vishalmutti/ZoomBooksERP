CREATE TABLE "freight_invoices" (
	"id" serial PRIMARY KEY NOT NULL,
	"load_id" integer NOT NULL,
	"invoice_number" varchar(50),
	"cost" numeric(10, 2),
	"trucking_company" varchar(255),
	"attachment_file" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "incoming_loads" (
	"id" serial PRIMARY KEY NOT NULL,
	"load_type" varchar(50) NOT NULL,
	"supplier_id" varchar(255) NOT NULL,
	"reference_number" varchar(50) NOT NULL,
	"location" varchar(50) NOT NULL,
	"invoice_number" varchar(50),
	"scheduled_date" date,
	"status" varchar(50) DEFAULT 'Pending' NOT NULL,
	"carrier" varchar(100),
	"notes" text,
	"amount" numeric(10, 2) NOT NULL,
	"freight_cost" numeric(10, 2) NOT NULL,
	"bol_file" text,
	"material_invoice_file" text,
	"freight_invoice_file" text,
	"load_performance_file" text,
	"material_invoice_status" varchar(10) DEFAULT 'UNPAID' NOT NULL,
	"freight_invoice_status" varchar(10) DEFAULT 'UNPAID' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_id" integer NOT NULL,
	"description" text NOT NULL,
	"quantity" numeric(10, 2),
	"unit_price" numeric(10, 2),
	"total_price" numeric(10, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" serial PRIMARY KEY NOT NULL,
	"supplier_id" integer,
	"invoice_number" varchar(50),
	"total_amount" numeric(10, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"due_date" date NOT NULL,
	"is_paid" boolean DEFAULT false NOT NULL,
	"payment_date" date,
	"notes" text,
	"uploaded_file" text,
	"bol_file" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "load_documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"load_id" integer NOT NULL,
	"document_type" varchar(50) NOT NULL,
	"file_name" text NOT NULL,
	"uploaded_at" timestamp DEFAULT now() NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "load_status_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"load_id" integer NOT NULL,
	"status" varchar(30) NOT NULL,
	"notes" text,
	"location" text,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"updated_by" varchar(255) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_id" integer NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"payment_date" timestamp DEFAULT now() NOT NULL,
	"payment_method" varchar(50) NOT NULL,
	"reference" varchar(100),
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "supplier_contacts" (
	"id" serial PRIMARY KEY NOT NULL,
	"supplier_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255),
	"phone" varchar(50),
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "suppliers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"address" text,
	"contact_person" varchar(255),
	"email" varchar(255),
	"phone" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "freight_invoices" ADD CONSTRAINT "freight_invoices_load_id_incoming_loads_id_fk" FOREIGN KEY ("load_id") REFERENCES "public"."incoming_loads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "load_documents" ADD CONSTRAINT "load_documents_load_id_incoming_loads_id_fk" FOREIGN KEY ("load_id") REFERENCES "public"."incoming_loads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "load_status_history" ADD CONSTRAINT "load_status_history_load_id_incoming_loads_id_fk" FOREIGN KEY ("load_id") REFERENCES "public"."incoming_loads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_contacts" ADD CONSTRAINT "supplier_contacts_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE cascade ON UPDATE no action;