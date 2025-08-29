import { Supplier, SupplierSettlement, SupplierInvoice, StockEntry, User } from "../models/index.js";
import { Op } from "sequelize";
import { parsePaginationParams, buildPaginationResponse, buildFilterConditions, parseFieldSelection } from "../utils/paginationHelpers.js";
import sequelize from "../config/database.js";

const supplierController = {
  // Get all suppliers with pagination and filtering
  getAllSuppliers: async (req, res, next) => {
    try {
      // Parse pagination parameters
      const paginationParams = parsePaginationParams(req.query, {
        defaultLimit: 50,
        maxLimit: 500,
        allowedSortFields: ["name", "accountBalance", "createdAt", "updatedAt"]
      });

      // Build filter conditions
      const whereClause = buildFilterConditions(
        req.query,
        {
          searchFields: ["name", "contactPerson", "email"],
          exactFilters: ["isActive"],
          rangeFilters: ["accountBalance", "createdAt", "updatedAt"]
        },
        Op
      );

      // Parse field selection
      const selectedFields = parseFieldSelection(req.query.fields, ["id", "name", "contactPerson", "email", "phone", "address", "taxId", "paymentTerms", "accountBalance", "creditLimit", "isActive", "notes", "createdAt", "updatedAt"]);

      const queryOptions = {
        where: whereClause,
        order: [[paginationParams.sortBy, paginationParams.sortOrder]],
        limit: paginationParams.limit,
        offset: paginationParams.offset,
        attributes: selectedFields
      };

      const { count, rows: suppliers } = await Supplier.findAndCountAll(queryOptions);

      const pagination = buildPaginationResponse(count, paginationParams.page, paginationParams.limit);

      res.status(200).json({
        data: suppliers,
        pagination,
        filters: {
          search: req.query.search || "",
          isActive: req.query.isActive || "",
          sortBy: paginationParams.sortBy,
          sortOrder: paginationParams.sortOrder,
          fields: req.query.fields || ""
        },
        meta: {
          requestTime: new Date().toISOString(),
          totalDataSize: suppliers.length
        }
      });
    } catch (err) {
      next(err);
    }
  },

  // Get a single supplier by ID with related data
  getSupplier: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { includeInvoices = "false", includeSettlements = "false" } = req.query;

      const queryOptions = {
        where: { id },
        include: []
      };

      if (includeInvoices === "true") {
        queryOptions.include.push({
          model: SupplierInvoice,
          as: "invoices",
          attributes: ["id", "invoiceNumber", "invoiceDate", "dueDate", "totalAmount", "paidAmount", "status"]
        });
      }

      if (includeSettlements === "true") {
        queryOptions.include.push({
          model: SupplierSettlement,
          as: "settlements",
          include: [
            {
              model: User,
              as: "processedBy",
              attributes: ["id", "name", "email"]
            }
          ],
          attributes: ["id", "amount", "paymentMethod", "referenceNumber", "paymentDate", "status", "notes"]
        });
      }

      const supplier = await Supplier.findOne(queryOptions);

      if (!supplier) {
        return res.status(404).json({ error: "Supplier not found" });
      }

      res.status(200).json(supplier);
    } catch (err) {
      next(err);
    }
  },

  // Create a new supplier
  createSupplier: async (req, res, next) => {
    try {
      const { name, contactPerson, email, phone, address, taxId, paymentTerms, creditLimit, notes } = req.body;

      // Validate required fields
      if (!name) {
        return res.status(400).json({ error: "Supplier name is required" });
      }

      const supplierData = {
        name,
        contactPerson,
        email,
        phone,
        address,
        taxId,
        paymentTerms: paymentTerms || 30,
        creditLimit: creditLimit || 0,
        notes
      };

      const supplier = await Supplier.create(supplierData);
      res.status(201).json(supplier);
    } catch (err) {
      next(err);
    }
  },

  // Update a supplier
  updateSupplier: async (req, res, next) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const supplier = await Supplier.findByPk(id);
      if (!supplier) {
        return res.status(404).json({ error: "Supplier not found" });
      }

      await supplier.update(updateData);
      res.status(200).json(supplier);
    } catch (err) {
      next(err);
    }
  },

  // Delete a supplier
  deleteSupplier: async (req, res, next) => {
    try {
      const { id } = req.params;
      const supplier = await Supplier.findByPk(id);

      if (!supplier) {
        return res.status(404).json({ error: "Supplier not found" });
      }

      // Check if supplier has outstanding balance
      if (supplier.accountBalance > 0) {
        return res.status(400).json({
          error: "Cannot delete supplier with outstanding balance"
        });
      }

      await supplier.destroy();
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },

  // Create supplier settlement (payment)
  createSettlement: async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
      const { id } = req.params;
      const { amount, paymentMethod, referenceNumber, paymentDate, notes, invoiceIds } = req.body;

      const supplier = await Supplier.findByPk(id, { transaction: t });
      if (!supplier) {
        await t.rollback();
        return res.status(404).json({ error: "Supplier not found" });
      }

      // Validate amount
      if (amount <= 0) {
        await t.rollback();
        return res.status(400).json({ error: "Settlement amount must be greater than 0" });
      }

      if (amount > supplier.accountBalance) {
        await t.rollback();
        return res.status(400).json({
          error: "Settlement amount cannot exceed outstanding balance"
        });
      }

      // Create settlement
      const settlement = await SupplierSettlement.create(
        {
          supplierId: id,
          amount,
          paymentMethod,
          referenceNumber,
          paymentDate: paymentDate || new Date(),
          notes,
          settledBy: req.user?.id,
          status: "completed"
        },
        { transaction: t }
      );

      // Update supplier balance
      await supplier.decrement("accountBalance", { by: amount, transaction: t });

      // Update related invoices if provided
      if (invoiceIds && Array.isArray(invoiceIds) && invoiceIds.length > 0) {
        const invoices = await SupplierInvoice.findAll({
          where: {
            id: invoiceIds,
            supplierId: id,
            status: { [Op.ne]: "paid" }
          },
          transaction: t
        });

        for (const invoice of invoices) {
          const remainingInvoiceAmount = invoice.totalAmount - invoice.paidAmount;
          const amountToApply = Math.min(amount, remainingInvoiceAmount);

          if (amountToApply > 0) {
            await invoice.update(
              {
                paidAmount: sequelize.literal(`paidAmount + ${amountToApply}`),
                status: invoice.totalAmount - (invoice.paidAmount + amountToApply) <= 0 ? "paid" : "partial"
              },
              { transaction: t }
            );
          }
        }
      }

      await t.commit();
      res.status(201).json(settlement);
    } catch (err) {
      await t.rollback();
      next(err);
    }
  },

  // Get supplier settlements
  getSettlements: async (req, res, next) => {
    try {
      const { id } = req.params;

      const paginationParams = parsePaginationParams(req.query, {
        defaultLimit: 50,
        maxLimit: 500,
        allowedSortFields: ["paymentDate", "amount", "createdAt"]
      });

      const whereClause = { supplierId: id };
      if (req.query.status) {
        whereClause.status = req.query.status;
      }

      const queryOptions = {
        where: whereClause,
        order: [[paginationParams.sortBy, paginationParams.sortOrder]],
        limit: paginationParams.limit,
        offset: paginationParams.offset,
        include: [
          {
            model: User,
            as: "processedBy",
            attributes: ["id", "firstName", "lastName"]
          }
        ]
      };

      const { count, rows: settlements } = await SupplierSettlement.findAndCountAll(queryOptions);

      const pagination = buildPaginationResponse(count, paginationParams.page, paginationParams.limit);

      res.status(200).json({
        data: settlements,
        pagination,
        filters: {
          status: req.query.status || "",
          sortBy: paginationParams.sortBy,
          sortOrder: paginationParams.sortOrder
        }
      });
    } catch (err) {
      next(err);
    }
  },

  // Get outstanding invoices for a supplier
  getOutstandingInvoices: async (req, res, next) => {
    try {
      const { id } = req.params;

      // For testing, return all invoices regardless of status
      const invoices = await SupplierInvoice.findAll({
        where: {
          supplierId: id
          // Temporarily removed status filter for testing
          // status: { [Op.in]: ["sent", "overdue", "partial"] }
        },
        order: [["dueDate", "ASC"]]
      });

      console.log(`Found ${invoices.length} invoices for supplier ${id}:`, JSON.stringify(invoices, null, 2));
      res.status(200).json(invoices);
    } catch (err) {
      next(err);
    }
  },

  // Bulk update supplier status
  bulkUpdateSupplierStatus: async (req, res, next) => {
    try {
      const { ids, isActive } = req.body;

      if (!ids || !Array.isArray(ids) || ids.length === 0 || typeof isActive !== "boolean") {
        return res.status(400).json({ error: "Invalid request format" });
      }

      await Supplier.update({ isActive }, { where: { id: ids } });

      res.status(200).json({ message: "Supplier status updated successfully" });
    } catch (err) {
      next(err);
    }
  }
};

export default supplierController;
