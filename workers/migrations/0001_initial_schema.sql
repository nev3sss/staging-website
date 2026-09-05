-- migrations/0001_initial_schema.sql

-- Enquiries Table
CREATE TABLE IF NOT EXISTS enquiries (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL, -- 'dealer_application' | 'general'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    message TEXT,
    metadata TEXT, -- JSON string for extra fields
    turnstile_token TEXT,
    ip_address TEXT
);

-- Dealer Applications Table
CREATE TABLE IF NOT EXISTS dealer_applications (
    id TEXT PRIMARY KEY,
    status TEXT DEFAULT 'pending', -- 'pending' | 'reviewed' | 'approved' | 'rejected'
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    business_name TEXT,
    phone TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    metadata TEXT -- JSON string for extra fields (e.g., franchise interest, location)
);

-- Marketplace Listings Table
CREATE TABLE IF NOT EXISTS listings (
    id TEXT PRIMARY KEY,
    seller_email TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    price REAL,
    currency TEXT DEFAULT 'USD',
    status TEXT DEFAULT 'active', -- 'active' | 'sold' | 'expired'
    category TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    media_urls TEXT -- JSON array of R2 object keys
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_enquiries_email ON enquiries(email);
CREATE INDEX IF NOT EXISTS idx_dealer_applications_status ON dealer_applications(status);
CREATE INDEX IF NOT EXISTS idx_listings_seller ON listings(seller_email);
