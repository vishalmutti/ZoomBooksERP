
CREATE TABLE IF NOT EXISTS carriers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address TEXT,
  contact_name VARCHAR(255),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);
