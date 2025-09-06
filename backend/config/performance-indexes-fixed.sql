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

-- ========================================
-- ORDERS TABLE PERFORMANCE INDEXES
-- ========================================

-- Basic indexes for Orders table
CREATE INDEX IF NOT EXISTS idx_orders_ordernumber ON "Orders"("orderNumber");
CREATE INDEX IF NOT EXISTS idx_orders_status ON "Orders"("status");
CREATE INDEX IF NOT EXISTS idx_orders_ordertype ON "Orders"("orderType");
CREATE INDEX IF NOT EXISTS idx_orders_tableid ON "Orders"("tableId");
CREATE INDEX IF NOT EXISTS idx_orders_createdat ON "Orders"("createdAt");
CREATE INDEX IF NOT EXISTS idx_orders_updatedat ON "Orders"("updatedAt");
CREATE INDEX IF NOT EXISTS idx_orders_completedat ON "Orders"("completedAt");
CREATE INDEX IF NOT EXISTS idx_orders_cancelledat ON "Orders"("cancelledAt");
CREATE INDEX IF NOT EXISTS idx_orders_saleid ON "Orders"("saleId");
CREATE INDEX IF NOT EXISTS idx_orders_createdby ON "Orders"("createdBy");
CREATE INDEX IF NOT EXISTS idx_orders_total ON "Orders"("total");

-- Composite indexes for common Orders query patterns
CREATE INDEX IF NOT EXISTS idx_orders_status_type ON "Orders"("status", "orderType");
CREATE INDEX IF NOT EXISTS idx_orders_status_date ON "Orders"("status", "createdAt");
CREATE INDEX IF NOT EXISTS idx_orders_type_date ON "Orders"("orderType", "createdAt");
CREATE INDEX IF NOT EXISTS idx_orders_table_status ON "Orders"("tableId", "status");
CREATE INDEX IF NOT EXISTS idx_orders_createdby_date ON "Orders"("createdBy", "createdAt");

-- Covering index for Orders dashboard queries
CREATE INDEX IF NOT EXISTS idx_orders_covering ON "Orders"(
    "status", "orderType", "createdAt",
    "id", "orderNumber", "tableId", "total", "createdBy"
);

-- ========================================
-- ORDER ITEMS TABLE PERFORMANCE INDEXES
-- ========================================

-- Basic indexes for OrderItems table
CREATE INDEX IF NOT EXISTS idx_orderitems_orderid ON "OrderItems"("orderId");
CREATE INDEX IF NOT EXISTS idx_orderitems_materialid ON "OrderItems"("materialId");
CREATE INDEX IF NOT EXISTS idx_orderitems_menuitemid ON "OrderItems"("menuItemId");
CREATE INDEX IF NOT EXISTS idx_orderitems_assignmentid ON "OrderItems"("assignmentId");
CREATE INDEX IF NOT EXISTS idx_orderitems_type ON "OrderItems"("type");
CREATE INDEX IF NOT EXISTS idx_orderitems_status ON "OrderItems"("status");
CREATE INDEX IF NOT EXISTS idx_orderitems_createdat ON "OrderItems"("createdAt");
CREATE INDEX IF NOT EXISTS idx_orderitems_updatedat ON "OrderItems"("updatedAt");
CREATE INDEX IF NOT EXISTS idx_orderitems_quantity ON "OrderItems"("quantity");
CREATE INDEX IF NOT EXISTS idx_orderitems_totalprice ON "OrderItems"("totalPrice");

-- Composite indexes for common OrderItems query patterns
CREATE INDEX IF NOT EXISTS idx_orderitems_order_status ON "OrderItems"("orderId", "status");
CREATE INDEX IF NOT EXISTS idx_orderitems_order_type ON "OrderItems"("orderId", "type");
CREATE INDEX IF NOT EXISTS idx_orderitems_material_status ON "OrderItems"("materialId", "status");
CREATE INDEX IF NOT EXISTS idx_orderitems_menuitem_status ON "OrderItems"("menuItemId", "status");
CREATE INDEX IF NOT EXISTS idx_orderitems_type_status ON "OrderItems"("type", "status");
CREATE INDEX IF NOT EXISTS idx_orderitems_assignment_status ON "OrderItems"("assignmentId", "status");

-- Covering index for OrderItems queries
CREATE INDEX IF NOT EXISTS idx_orderitems_covering ON "OrderItems"(
    "orderId", "status", "type",
    "id", "materialId", "menuItemId", "quantity", "unitPrice", "totalPrice"
);

-- Partial indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_orderitems_active_materials ON "OrderItems"("materialId", "orderId") 
WHERE "materialId" IS NOT NULL AND "status" != 'cancelled';

CREATE INDEX IF NOT EXISTS idx_orderitems_active_menuitems ON "OrderItems"("menuItemId", "orderId") 
WHERE "menuItemId" IS NOT NULL AND "status" != 'cancelled';

-- Date-based indexes for reporting (simple indexes without functions)
CREATE INDEX IF NOT EXISTS idx_orders_created_date ON "Orders"("createdAt", "status");
CREATE INDEX IF NOT EXISTS idx_orderitems_created_date ON "OrderItems"("createdAt", "type");
