import { Supplier, SupplierPayment, StockEntry } from "../models/index.js";
import { Op } from "sequelize";
import sequelize from "../config/database.js";
import { parsePaginationParams, buildPaginationResponse, buildFilterConditions } from "../utils/paginationHelpers.js";

// Get all suppliers with pagination and filtering
export const getAllSuppliers = async (req, res) => {
  try {
    const paginationParams = parsePaginationParams(req.query, {
      defaultLimit: 50,
      maxLimit: 1000,
      defaultSortBy: "name",
      allowedSortFields: ["id", "name", "contactPerson", "email", "phone", "createdAt", "updatedAt"]
    });
    const whereClause = buildFilterConditions(
      req.query,
      {
        searchFields: ["name", "contactPerson", "email", "phone", "address"],
        exactFilters: ["isActive"],
        rangeFilters: ["createdAt", "updatedAt"]
      },
      Op
    );
    const { count, rows: suppliers } = await Supplier.findAndCountAll({
      where: whereClause,
      order: [[paginationParams.sortBy, paginationParams.sortOrder]],
      offset: paginationParams.offset,
      limit: paginationParams.limit
    });
    const pagination = buildPaginationResponse(count, paginationParams.page, paginationParams.limit);
    return res.status(200).json({
      data: suppliers,
      pagination,
      filters: {
        search: req.query.search || "",
        isActive: req.query.isActive || "",
        sortBy: paginationParams.sortBy,
        sortOrder: paginationParams.sortOrder
      }
    });
  } catch (error) {
    console.error("Error getting suppliers:", error);
    return res.status(500).json({ error: "Failed to get suppliers" });
  }
};

// Get supplier by ID
export const getSupplierById = async (req, res) => {
  try {
    const { id } = req.params;
    const supplier = await Supplier.findByPk(id, {
      include: [
        {
          model: SupplierPayment,
          as: "payments",
          separate: true,
          order: [["paymentDate", "DESC"]]
        }
      ]
    });
    if (!supplier) {
      return res.status(404).json({ error: "Supplier not found" });
    }
    return res.status(200).json(supplier);
  } catch (error) {
    console.error("Error getting supplier:", error);
    return res.status(500).json({ error: "Failed to get supplier" });
  }
};

// Create a new supplier
export const createSupplier = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { name, contactPerson, email, phone, address, paymentTerms, notes, isActive = true, website, taxId } = req.body;
    if (!name) {
      await transaction.rollback();
      return res.status(400).json({ error: "Supplier name is required" });
    }
    const existingSupplier = await Supplier.findOne({
      where: { name },
      transaction
    });
    if (existingSupplier) {
      await transaction.rollback();
      return res.status(409).json({ error: "Supplier with this name already exists" });
    }
    const supplier = await Supplier.create( { name, contactPerson, email, phone, address, paymentTerms, notes, isActive, website, taxId }, { transaction } );
    await transaction.commit();
    return res.status(201).json(supplier);
  } catch (error) {
    await transaction.rollback();
    console.error("Error creating supplier:", error);
    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: "Failed to create supplier" });
  }
};

// Update a supplier
export const updateSupplier = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { name, contactPerson, email, phone, address, paymentTerms, notes, isActive, website, taxId } = req.body;
    const supplier = await Supplier.findByPk(id, { transaction });
    if (!supplier) {
      await transaction.rollback();
      return res.status(404).json({ error: "Supplier not found" });
    }
    if (name && name !== supplier.name) {
      const existingSupplier = await Supplier.findOne({
        where: { name, id: { [Op.ne]: id } },
        transaction
      });
      if (existingSupplier) {
        await transaction.rollback();
        return res.status(409).json({ error: "Another supplier with this name already exists" });
      }
    }
    await supplier.update(
      {
        name: name || supplier.name,
        contactPerson: contactPerson !== undefined ? contactPerson : supplier.contactPerson,
        email: email !== undefined ? email : supplier.email,
        phone: phone !== undefined ? phone : supplier.phone,
        address: address !== undefined ? address : supplier.address,
        paymentTerms: paymentTerms !== undefined ? paymentTerms : supplier.paymentTerms,
        notes: notes !== undefined ? notes : supplier.notes,
        isActive: isActive !== undefined ? isActive : supplier.isActive,
        website: website !== undefined ? website : supplier.website,
        taxId: taxId !== undefined ? taxId : supplier.taxId
      },
      { transaction }
    );
    await transaction.commit();
    const updatedSupplier = await Supplier.findByPk(id, {
      include: [
        {
          model: SupplierPayment,
          as: "payments",
          separate: true,
          order: [["paymentDate", "DESC"]]
        }
      ]
    });

    return res.status(200).json(updatedSupplier);
  } catch (error) {
    await transaction.rollback();
    console.error("Error updating supplier:", error);
    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: "Failed to update supplier" });
  }
};

// Delete a supplier
export const deleteSupplier = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const supplier = await Supplier.findByPk(id, { transaction });
    if (!supplier) {
      await transaction.rollback();
      return res.status(404).json({ error: "Supplier not found" });
    }
    const paymentCount = await SupplierPayment.count({
      where: { supplierId: id },
      transaction
    });
    if (paymentCount > 0) {
      await transaction.rollback();
      return res.status(400).json({
        error: "Cannot delete supplier with associated payments. Deactivate the supplier instead.",
        paymentCount
      });
    }
    const stockEntryCount = await StockEntry.count({
      where: { supplierId: id },
      transaction
    });
    if (stockEntryCount > 0) {
      await transaction.rollback();
      return res.status(400).json({
        error: "Cannot delete supplier with associated stock entries. Deactivate the supplier instead.",
        stockEntryCount
      });
    }
    await supplier.destroy({ transaction });
    await transaction.commit();
    return res.status(200).json({ message: "Supplier deleted successfully" });
  } catch (error) {
    await transaction.rollback();
    console.error("Error deleting supplier:", error);
    return res.status(500).json({ error: "Failed to delete supplier" });
  }
};

// Toggle supplier active status
export const toggleSupplierStatus = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const supplier = await Supplier.findByPk(id, { transaction });
    if (!supplier) {
      await transaction.rollback();
      return res.status(404).json({ error: "Supplier not found" });
    }
    await supplier.update( { isActive: !supplier.isActive }, { transaction } );
    await transaction.commit();
    return res.status(200).json({
      id: supplier.id,
      name: supplier.name,
      isActive: !supplier.isActive,
      message: `Supplier ${!supplier.isActive ? "activated" : "deactivated"} successfully`
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Error toggling supplier status:", error);
    return res.status(500).json({ error: "Failed to update supplier status" });
  }
};
