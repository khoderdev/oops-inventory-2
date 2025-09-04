import { Supplier, SupplierPayment, StockEntry } from "../models/index.js";
import { Op } from "sequelize";
import sequelize from "../config/database.js";
import { parsePaginationParams, buildPaginationResponse, buildFilterConditions } from "../utils/paginationHelpers.js";

// Get all supplier payments with pagination and filtering
export const getAllSupplierPayments = async (req, res) => {
  try {
    // Parse pagination parameters
    const paginationParams = parsePaginationParams(req.query, {
      defaultLimit: 50,
      maxLimit: 1000,
      defaultSortBy: "paymentDate",
      defaultSortOrder: "DESC",
      allowedSortFields: ["id", "paymentDate", "amount", "paymentMethod", "status", "createdAt", "updatedAt"]
    });

    // Build filter conditions
    const whereClause = {};
    
    // Apply exact filters
    const exactFilters = ['supplierId', 'status', 'paymentMethod'];
    exactFilters.forEach(field => {
      if (req.query[field]) {
        whereClause[field] = req.query[field];
      }
    });
    
    // Date range filter
    if (req.query.startDate || req.query.endDate) {
      whereClause.paymentDate = {};
      
      if (req.query.startDate) {
        whereClause.paymentDate[Op.gte] = new Date(req.query.startDate);
      }
      
      if (req.query.endDate) {
        whereClause.paymentDate[Op.lte] = new Date(req.query.endDate);
      }
    }
    
    // Amount range filter
    if (req.query.minAmount || req.query.maxAmount) {
      whereClause.amount = {};
      
      if (req.query.minAmount) {
        whereClause.amount[Op.gte] = parseFloat(req.query.minAmount);
      }
      
      if (req.query.maxAmount) {
        whereClause.amount[Op.lte] = parseFloat(req.query.maxAmount);
      }
    }
    
    // Get payments with count
    const { count, rows: payments } = await SupplierPayment.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Supplier,
          as: 'supplier',
          attributes: ['id', 'name']
        }
      ],
      order: [[paginationParams.sortBy, paginationParams.sortOrder]],
      offset: paginationParams.offset,
      limit: paginationParams.limit
    });

    // Build pagination response
    const pagination = buildPaginationResponse(count, paginationParams.page, paginationParams.limit);

    return res.status(200).json({
      data: payments,
      pagination,
      filters: {
        supplierId: req.query.supplierId || "",
        status: req.query.status || "",
        paymentMethod: req.query.paymentMethod || "",
        startDate: req.query.startDate || "",
        endDate: req.query.endDate || "",
        minAmount: req.query.minAmount || "",
        maxAmount: req.query.maxAmount || "",
        sortBy: paginationParams.sortBy,
        sortOrder: paginationParams.sortOrder
      }
    });
  } catch (error) {
    console.error("Error getting supplier payments:", error);
    return res.status(500).json({ error: "Failed to get supplier payments" });
  }
};

// Get payment by ID
export const getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const payment = await SupplierPayment.findByPk(id, {
      include: [
        {
          model: Supplier,
          as: 'supplier',
          attributes: ['id', 'name', 'contactPerson', 'email', 'phone']
        }
      ]
    });
    
    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }
    
    // If payment has associated stock entries, fetch them
    let stockEntries = [];
    if (payment.stockEntryIds && Array.isArray(payment.stockEntryIds) && payment.stockEntryIds.length > 0) {
      stockEntries = await StockEntry.findAll({
        where: {
          id: {
            [Op.in]: payment.stockEntryIds
          }
        },
        attributes: ['id', 'materialId', 'purchasedIndividualQuantity', 'purchasedIndividualCost', 'purchaseDate']
      });
    }
    
    return res.status(200).json({
      ...payment.toJSON(),
      stockEntries
    });
  } catch (error) {
    console.error("Error getting payment:", error);
    return res.status(500).json({ error: "Failed to get payment" });
  }
};

// Create a new payment
export const createPayment = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const {
      supplierId,
      amount,
      paymentDate,
      paymentMethod,
      referenceNumber,
      description,
      status,
      attachmentUrl,
      stockEntryIds
    } = req.body;
    
    // Validate required fields
    if (!supplierId) {
      await transaction.rollback();
      return res.status(400).json({ error: "Supplier ID is required" });
    }
    
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      await transaction.rollback();
      return res.status(400).json({ error: "Valid payment amount is required" });
    }
    
    // Check if supplier exists
    const supplier = await Supplier.findByPk(supplierId, { transaction });
    if (!supplier) {
      await transaction.rollback();
      return res.status(404).json({ error: "Supplier not found" });
    }
    
    // Validate stock entries if provided
    if (stockEntryIds && Array.isArray(stockEntryIds) && stockEntryIds.length > 0) {
      const stockEntriesCount = await StockEntry.count({
        where: {
          id: {
            [Op.in]: stockEntryIds
          }
        },
        transaction
      });
      
      if (stockEntriesCount !== stockEntryIds.length) {
        await transaction.rollback();
        return res.status(400).json({ error: "One or more stock entries not found" });
      }
    }
    
    // Create payment
    const payment = await SupplierPayment.create({
      supplierId,
      amount,
      paymentDate: paymentDate || new Date(),
      paymentMethod: paymentMethod || "Cash",
      referenceNumber,
      description,
      status: status || "Completed",
      attachmentUrl,
      stockEntryIds: stockEntryIds || []
    }, { transaction });
    
    await transaction.commit();
    
    // Fetch the created payment with supplier details
    const createdPayment = await SupplierPayment.findByPk(payment.id, {
      include: [
        {
          model: Supplier,
          as: 'supplier',
          attributes: ['id', 'name']
        }
      ]
    });
    
    return res.status(201).json(createdPayment);
  } catch (error) {
    await transaction.rollback();
    console.error("Error creating payment:", error);
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ error: error.message });
    }
    
    return res.status(500).json({ error: "Failed to create payment" });
  }
};

// Update a payment
export const updatePayment = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const {
      amount,
      paymentDate,
      paymentMethod,
      referenceNumber,
      description,
      status,
      attachmentUrl,
      stockEntryIds
    } = req.body;
    
    // Find payment
    const payment = await SupplierPayment.findByPk(id, { transaction });
    
    if (!payment) {
      await transaction.rollback();
      return res.status(404).json({ error: "Payment not found" });
    }
    
    // Validate amount if provided
    if (amount !== undefined && (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0)) {
      await transaction.rollback();
      return res.status(400).json({ error: "Valid payment amount is required" });
    }
    
    // Validate stock entries if provided
    if (stockEntryIds && Array.isArray(stockEntryIds) && stockEntryIds.length > 0) {
      const stockEntriesCount = await StockEntry.count({
        where: {
          id: {
            [Op.in]: stockEntryIds
          }
        },
        transaction
      });
      
      if (stockEntriesCount !== stockEntryIds.length) {
        await transaction.rollback();
        return res.status(400).json({ error: "One or more stock entries not found" });
      }
    }
    
    // Update payment
    await payment.update({
      amount: amount !== undefined ? amount : payment.amount,
      paymentDate: paymentDate !== undefined ? paymentDate : payment.paymentDate,
      paymentMethod: paymentMethod !== undefined ? paymentMethod : payment.paymentMethod,
      referenceNumber: referenceNumber !== undefined ? referenceNumber : payment.referenceNumber,
      description: description !== undefined ? description : payment.description,
      status: status !== undefined ? status : payment.status,
      attachmentUrl: attachmentUrl !== undefined ? attachmentUrl : payment.attachmentUrl,
      stockEntryIds: stockEntryIds !== undefined ? stockEntryIds : payment.stockEntryIds
    }, { transaction });
    
    await transaction.commit();
    
    // Fetch updated payment with supplier details
    const updatedPayment = await SupplierPayment.findByPk(id, {
      include: [
        {
          model: Supplier,
          as: 'supplier',
          attributes: ['id', 'name']
        }
      ]
    });
    
    return res.status(200).json(updatedPayment);
  } catch (error) {
    await transaction.rollback();
    console.error("Error updating payment:", error);
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ error: error.message });
    }
    
    return res.status(500).json({ error: "Failed to update payment" });
  }
};

// Delete a payment
export const deletePayment = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    
    // Check if payment exists
    const payment = await SupplierPayment.findByPk(id, { transaction });
    
    if (!payment) {
      await transaction.rollback();
      return res.status(404).json({ error: "Payment not found" });
    }
    
    // Delete payment
    await payment.destroy({ transaction });
    
    await transaction.commit();
    return res.status(200).json({ message: "Payment deleted successfully" });
  } catch (error) {
    await transaction.rollback();
    console.error("Error deleting payment:", error);
    return res.status(500).json({ error: "Failed to delete payment" });
  }
};

// Get payment statistics for a supplier
export const getSupplierPaymentStats = async (req, res) => {
  try {
    const { supplierId } = req.params;
    
    // Check if supplier exists
    const supplier = await Supplier.findByPk(supplierId);
    if (!supplier) {
      return res.status(404).json({ error: "Supplier not found" });
    }
    
    // Get total payments
    const totalPayments = await SupplierPayment.sum('amount', {
      where: { 
        supplierId,
        status: 'Completed'
      }
    });
    
    // Get payment count by status
    const paymentCountByStatus = await SupplierPayment.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('amount')), 'total']
      ],
      where: { supplierId },
      group: ['status']
    });
    
    // Get payment count by method
    const paymentCountByMethod = await SupplierPayment.findAll({
      attributes: [
        'paymentMethod',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('amount')), 'total']
      ],
      where: { supplierId },
      group: ['paymentMethod']
    });
    
    // Get recent payments
    const recentPayments = await SupplierPayment.findAll({
      where: { supplierId },
      order: [['paymentDate', 'DESC']],
      limit: 5
    });
    
    return res.status(200).json({
      supplierId,
      supplierName: supplier.name,
      totalPayments: totalPayments || 0,
      paymentCountByStatus,
      paymentCountByMethod,
      recentPayments
    });
  } catch (error) {
    console.error("Error getting supplier payment stats:", error);
    return res.status(500).json({ error: "Failed to get supplier payment statistics" });
  }
};
