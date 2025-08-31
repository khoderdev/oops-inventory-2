-- Migration script to add volumePerUnit and volumeUnit fields to Materials table
-- Run this script to add the new beverage volume tracking fields

-- Add volumePerUnit field (decimal with 3 decimal places)
ALTER TABLE Materials 
ADD COLUMN volumePerUnit DECIMAL(10,3) NULL 
COMMENT 'Volume per unit for beverages (e.g., 330ml per bottle)';

-- Add volumeUnit field (string for unit type)
ALTER TABLE Materials 
ADD COLUMN volumeUnit VARCHAR(20) NULL 
COMMENT 'Unit for volumePerUnit field (ml, cl, l, etc.)';

-- Add check constraint for volumePerUnit to ensure non-negative values
ALTER TABLE Materials 
ADD CONSTRAINT chk_volumePerUnit_positive 
CHECK (volumePerUnit IS NULL OR volumePerUnit >= 0);

-- Add check constraint for volumeUnit to ensure valid volume units
ALTER TABLE Materials 
ADD CONSTRAINT chk_volumeUnit_valid 
CHECK (volumeUnit IS NULL OR volumeUnit IN (
    'ml', 'cl', 'dl', 'l', 
    'fl_oz', 'cup', 'pt', 'qt', 'gal',
    'fl_oz_uk', 'pt_uk', 'qt_uk', 'gal_uk'
));

-- Create index for better query performance on beverage materials
CREATE INDEX idx_materials_volume_fields 
ON Materials(volumePerUnit, volumeUnit) 
WHERE volumePerUnit IS NOT NULL;

-- Log the migration
INSERT INTO migration_log (migration_name, executed_at, description) 
VALUES (
    'add_beverage_volume_fields', 
    NOW(), 
    'Added volumePerUnit and volumeUnit fields to Materials table for beverage volume tracking'
) ON DUPLICATE KEY UPDATE executed_at = NOW();

SELECT 'Migration completed: Added volumePerUnit and volumeUnit fields to Materials table' AS status;
