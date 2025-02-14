
CREATE TABLE IF NOT EXISTS freight (
  id SERIAL PRIMARY KEY,
  reference_number VARCHAR(100) NOT NULL,
  carrier VARCHAR(255),
  freight_cost DECIMAL(10,2),
  file TEXT,
  freight_invoice TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
