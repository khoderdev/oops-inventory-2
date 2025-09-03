-- Performance indexes for stockEntries table (verified working)
-- First, let's check what tables exist and use the correct names

-- For PostgreSQL, table names might be case-sensitive or use different naming
-- Try these variations based on common Sequelize naming patterns:

-- Table name confirmed: "stockEntries" (camelCase with quotes)

-- Basic indexes
CREATE INDEX IF NOT EXISTS idx_stockentries_materialid ON "stockEntries"("materialId");
CREATE INDEX IF NOT EXISTS idx_stockentries_supplier ON "stockEntries"("supplier");
CREATE INDEX IF NOT EXISTS idx_stockentries_ispositem ON "stockEntries"("isPOSItem");
CREATE INDEX IF NOT EXISTS idx_stockentries_printerid ON "stockEntries"("printerId");
CREATE INDEX IF NOT EXISTS idx_stockentries_purchasedate ON "stockEntries"("purchaseDate");
CREATE INDEX IF NOT EXISTS idx_stockentries_expirydate ON "stockEntries"("expiryDate");
CREATE INDEX IF NOT EXISTS idx_stockentries_createdat ON "stockEntries"("createdAt");
CREATE INDEX IF NOT EXISTS idx_stockentries_updatedat ON "stockEntries"("updatedAt");
CREATE INDEX IF NOT EXISTS idx_stockentries_totalcost ON "stockEntries"("totalCost");
CREATE INDEX IF NOT EXISTS idx_stockentries_purchasedquantity ON "stockEntries"("purchasedQuantity");

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_stockentries_material_pos ON "stockEntries"("materialId", "isPOSItem");
CREATE INDEX IF NOT EXISTS idx_stockentries_material_date ON "stockEntries"("materialId", "purchaseDate");
CREATE INDEX IF NOT EXISTS idx_stockentries_pos_date ON "stockEntries"("isPOSItem", "purchaseDate");

-- Wastage table indexes
CREATE INDEX IF NOT EXISTS idx_wasting_stockentryid ON "wastings"("stockEntryId");
CREATE INDEX IF NOT EXISTS idx_wasting_wastedate ON "wastings"("wasteDate");
CREATE INDEX IF NOT EXISTS idx_wasting_reason ON "wastings"("wasteReason");

-- Covering index for common SELECT operations
CREATE INDEX IF NOT EXISTS idx_stockentries_covering ON "stockEntries"(
    "materialId", "isPOSItem", "purchaseDate", 
    "id", "supplier", "purchasedQuantity", "purchasedUnit", "totalCost"
);
