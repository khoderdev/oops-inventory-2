import { Op } from "sequelize";
import { AuditLog,User, Employee, Attendance } from "../models/index.js";

const attendanceController = {
  // Check in an employee
  checkIn: async (req, res) => {
    const { employeeId, code, notes } = req.body;
    
    try {
      // Find employee by ID or code
      const employee = await Employee.findOne({
        where: {
          [Op.or]: [
            { id: employeeId },
            { attendanceCode: code }
          ]
        }
      });

      if (!employee) {
        return res.status(404).json({
          success: false,
          message: 'Employee not found or invalid code'
        });
      }

      // Check if already checked in
      const currentAttendance = await employee.getCurrentAttendance();
      if (currentAttendance) {
        return res.status(400).json({
          success: false,
          message: 'Employee is already checked in',
          checkInTime: currentAttendance.checkIn
        });
      }

      // Check in the employee
      const attendance = await employee.checkIn(notes);
      
      // Log the action
      await AuditLog.logUserAction(
        req.user?.id || null,
        'check_in',
        'attendance',
        attendance.id,
        { employeeId: employee.id, checkIn: attendance.checkIn },
        req
      );

      res.status(200).json({
        success: true,
        message: 'Successfully checked in',
        data: {
          employee: {
            id: employee.id,
            fullName: employee.getFullName(),
            employeeNumber: employee.employeeNumber
          },
          checkIn: attendance.checkIn
        }
      });
    } catch (error) {
      console.error('Check-in error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to check in',
        error: error.message
      });
    }
  },

  // Check out an employee
  checkOut: async (req, res) => {
    const { employeeId, code, notes } = req.body;
    
    try {
      // Find employee by ID or code
      const employee = await Employee.findOne({
        where: {
          [Op.or]: [
            { id: employeeId },
            { attendanceCode: code }
          ]
        }
      });

      if (!employee) {
        return res.status(404).json({
          success: false,
          message: 'Employee not found or invalid code'
        });
      }

      // Check if already checked out
      const currentAttendance = await employee.getCurrentAttendance();
      if (!currentAttendance) {
        return res.status(400).json({
          success: false,
          message: 'Employee is not checked in'
        });
      }

      // Check out the employee
      await currentAttendance.checkOutEmployee();
      
      // Log the action
      await AuditLog.logUserAction(
        req.user?.id || null,
        'check_out',
        'attendance',
        currentAttendance.id,
        { 
          employeeId: employee.id, 
          checkIn: currentAttendance.checkIn,
          checkOut: currentAttendance.checkOut,
          duration: (currentAttendance.checkOut - currentAttendance.checkIn) / 1000 / 60 // in minutes
        },
        req
      );

      res.status(200).json({
        success: true,
        message: 'Successfully checked out',
        data: {
          employee: {
            id: employee.id,
            fullName: employee.getFullName(),
            employeeNumber: employee.employeeNumber
          },
          checkIn: currentAttendance.checkIn,
          checkOut: currentAttendance.checkOut,
          duration: (currentAttendance.checkOut - currentAttendance.checkIn) / 1000 / 60 // in minutes
        }
      });
    } catch (error) {
      console.error('Check-out error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to check out',
        error: error.message
      });
    }
  },

  // Get attendance records for an employee
  getEmployeeAttendance: async (req, res) => {
    const { employeeId } = req.params;
    const { startDate, endDate, page = 1, limit = 30 } = req.query;
    
    try {
      const offset = (page - 1) * limit;
      const where = { employeeId };
      
      // Add date range filter if provided
      if (startDate && endDate) {
        where.checkIn = {
          [Op.between]: [new Date(startDate), new Date(endDate)]
        };
      }

      const { count, rows: attendance } = await Attendance.findAndCountAll({
        where,
        include: [
          {
            model: Employee,
            as: 'employee',
            attributes: ['id', 'firstName', 'lastName', 'employeeNumber']
          }
        ],
        order: [['checkIn', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      res.status(200).json({
        success: true,
        data: {
          attendance,
          pagination: {
            total: count,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(count / limit)
          }
        }
      });
    } catch (error) {
      console.error('Get attendance error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get attendance records',
        error: error.message
      });
    }
  },

  // Generate or get attendance code for an employee
  generateAttendanceCode: async (req, res) => {
    const { employeeId } = req.params;
    
    try {
      const employee = await Employee.findByPk(employeeId);
      
      if (!employee) {
        return res.status(404).json({
          success: false,
          message: 'Employee not found'
        });
      }
      
      // If employee already has a code, return it
      if (employee.attendanceCode) {
        return res.status(200).json({
          success: true,
          data: {
            employeeId: employee.id,
            code: employee.attendanceCode
          },
          message: 'Using existing attendance code'
        });
      }
      
      // Generate and save new code
      const code = await Employee.generateAttendanceCode();
      employee.attendanceCode = code;
      await employee.save();
      
      // Log the action
      await AuditLog.logUserAction(
        req.user?.id || null,
        'generate_code',
        'attendance',
        employee.id,
        { code },
        req
      );

      res.status(200).json({
        success: true,
        data: {
          employeeId: employee.id,
          code
        },
        message: 'Generated new attendance code'
      });
    } catch (error) {
      console.error('Generate code error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate attendance code',
        error: error.message
      });
    }
  },

  // Get current attendance status for all employees
  getCurrentAttendanceStatus: async (req, res) => {
    try {
      const employees = await Employee.findAll({
        include: [
          {
            model: Attendance,
            as: 'attendances',
            where: {
              status: 'checked_in'
            },
            required: false,
            limit: 1,
            order: [['checkIn', 'DESC']]
          },
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'firstName', 'lastName'],
            required: false
          }
        ],
        where: {
          isActive: true
        },
        order: [['firstName', 'ASC'], ['lastName', 'ASC']]
      });

      const status = employees.map(employee => ({
        id: employee.id,
        employeeNumber: employee.employeeNumber,
        fullName: employee.getFullName(),
        department: employee.department,
        position: employee.position,
        isClockedIn: employee.attendances && employee.attendances.length > 0,
        lastCheckIn: employee.attendances && employee.attendances[0]?.checkIn,
        user: employee.user
      }));

      res.status(200).json({
        success: true,
        data: status
      });
    } catch (error) {
      console.error('Get current attendance status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get current attendance status',
        error: error.message
      });
    }
  }
};

export default attendanceController;
