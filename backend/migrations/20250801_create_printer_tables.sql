-- Migration: Create Printer Management Tables
-- Date: 2025-08-01
-- Description: Creates tables for printer channels, printers, and print jobs

-- Create printer_channels table
CREATE TABLE IF NOT EXISTS printer_channels (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    isActive BOOLEAN NOT NULL DEFAULT true,
    priority INTEGER NOT NULL DEFAULT 1 CHECK (priority >= 1 AND priority <= 10),
    settings JSONB NOT NULL DEFAULT '{
        "autoRetry": true,
        "retryAttempts": 3,
        "retryDelay": 5000,
        "fallbackChannelId": null
    }'::jsonb,
    createdBy INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    createdAt TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updatedAt TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create printers table
CREATE TABLE IF NOT EXISTS printers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    channel_id INTEGER NOT NULL REFERENCES printer_channels(id) ON DELETE CASCADE ON UPDATE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('thermal', 'inkjet', 'laser', 'receipt', 'label')),
    connection_type VARCHAR(20) NOT NULL CHECK (connection_type IN ('usb', 'network', 'bluetooth', 'serial')),
    
    -- Network Configuration
    network_config JSONB DEFAULT '{
        "ipAddress": null,
        "port": 9100,
        "protocol": "raw"
    }'::jsonb,
    
    -- OS Integration (Windows)
    os_config JSONB DEFAULT '{
        "printerName": null,
        "driverName": null,
        "isDefault": false,
        "isShared": false,
        "shareName": null
    }'::jsonb,
    
    -- Print Settings
    settings JSONB NOT NULL DEFAULT '{
        "paperSize": "80mm",
        "orientation": "portrait",
        "margins": {"top": 0, "right": 0, "bottom": 0, "left": 0},
        "dpi": 203,
        "duplex": false,
        "copies": 1,
        "colorMode": "monochrome"
    }'::jsonb,
    
    -- Printer Capabilities
    capabilities JSONB NOT NULL DEFAULT '{
        "maxWidth": 80,
        "maxLength": 3000,
        "supportsCutter": false,
        "supportsDrawer": false,
        "supportsBarcodes": false,
        "supportsImages": false,
        "supportsColor": false,
        "supportedFormats": ["text", "escpos"]
    }'::jsonb,
    
    -- Status & Health
    status VARCHAR(20) NOT NULL DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'error', 'busy', 'maintenance')),
    last_ping TIMESTAMP WITH TIME ZONE,
    last_print_job TIMESTAMP WITH TIME ZONE,
    error_count INTEGER NOT NULL DEFAULT 0,
    total_jobs INTEGER NOT NULL DEFAULT 0,
    
    -- Management
    isActive BOOLEAN NOT NULL DEFAULT true,
    location VARCHAR(200),
    description TEXT,
    createdBy INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    createdAt TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updatedAt TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create print_jobs table
CREATE TABLE IF NOT EXISTS print_jobs (
    id SERIAL PRIMARY KEY,
    channel_id INTEGER NOT NULL REFERENCES printer_channels(id) ON DELETE CASCADE ON UPDATE CASCADE,
    printer_id INTEGER NOT NULL REFERENCES printers(id) ON DELETE CASCADE ON UPDATE CASCADE,
    job_type VARCHAR(20) NOT NULL CHECK (job_type IN ('receipt', 'label', 'report', 'invoice', 'ticket', 'barcode')),
    
    -- Content Configuration
    content JSONB NOT NULL DEFAULT '{
        "template": null,
        "data": {},
        "rawContent": "",
        "format": "text",
        "encoding": "utf8"
    }'::jsonb,
    
    -- Print Settings (can override printer defaults)
    settings JSONB NOT NULL DEFAULT '{
        "copies": 1,
        "priority": "normal",
        "paperSize": null,
        "margins": null,
        "orientation": null,
        "duplex": null,
        "colorMode": null
    }'::jsonb,
    
    -- Job Status & Tracking
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'queued', 'printing', 'completed', 'failed', 'cancelled', 'paused')),
    attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
    max_attempts INTEGER NOT NULL DEFAULT 3 CHECK (max_attempts >= 1 AND max_attempts <= 10),
    
    -- Timestamps
    timestamps JSONB NOT NULL DEFAULT '{
        "created": null,
        "queued": null,
        "started": null,
        "completed": null,
        "failed": null,
        "cancelled": null
    }'::jsonb,
    
    -- Error Handling
    error JSONB,
    
    -- Metadata & Context
    metadata JSONB NOT NULL DEFAULT '{
        "userId": null,
        "orderId": null,
        "sessionId": null,
        "clientIP": null,
        "userAgent": null,
        "source": "pos"
    }'::jsonb,
    
    -- Performance Metrics
    metrics JSONB NOT NULL DEFAULT '{
        "queueTime": null,
        "printTime": null,
        "totalTime": null,
        "dataSize": null
    }'::jsonb,
    
    createdAt TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updatedAt TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_printer_channels_name ON printer_channels(name);
CREATE INDEX IF NOT EXISTS idx_printer_channels_active_priority ON printer_channels(isActive, priority);
CREATE INDEX IF NOT EXISTS idx_printer_channels_created_by ON printer_channels(createdBy);

CREATE INDEX IF NOT EXISTS idx_printers_channel_active ON printers(channel_id, isActive);
CREATE INDEX IF NOT EXISTS idx_printers_status ON printers(status);
CREATE INDEX IF NOT EXISTS idx_printers_connection_type ON printers(connection_type);
CREATE INDEX IF NOT EXISTS idx_printers_created_by ON printers(createdBy);

CREATE INDEX IF NOT EXISTS idx_print_jobs_status_created ON print_jobs(status, createdAt DESC);
CREATE INDEX IF NOT EXISTS idx_print_jobs_printer_status ON print_jobs(printer_id, status);
CREATE INDEX IF NOT EXISTS idx_print_jobs_channel_status ON print_jobs(channel_id, status);
CREATE INDEX IF NOT EXISTS idx_print_jobs_metadata ON print_jobs USING GIN(metadata);
CREATE INDEX IF NOT EXISTS idx_print_jobs_settings ON print_jobs USING GIN(settings);

-- Create triggers for updatedAt timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updatedAt = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_printer_channels_updated_at 
    BEFORE UPDATE ON printer_channels 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_printers_updated_at 
    BEFORE UPDATE ON printers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_print_jobs_updated_at 
    BEFORE UPDATE ON print_jobs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default printer channel
INSERT INTO printer_channels (name, description, priority, createdBy)
SELECT 'Default Channel', 'Default printer channel for general printing', 1, 1
WHERE NOT EXISTS (SELECT 1 FROM printer_channels WHERE name = 'Default Channel');

COMMENT ON TABLE printer_channels IS 'Printer channels for organizing printers by function or location';
COMMENT ON TABLE printers IS 'Physical printer devices and their configurations';
COMMENT ON TABLE print_jobs IS 'Print job queue and history with detailed tracking';
