import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const InventoryWarning = sequelize.define('InventoryWarning', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  type: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: 'Type of warning (e.g., low_sauce, out_of_stock)'
  },
  item_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'ID of the affected item (sauce, material, etc.)'
  },
  item_type: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Type of the affected item (e.g., sauce, material)'
  },
  item_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Name of the affected item'
  },
  required: {
    type: DataTypes.DECIMAL(10, 6),
    allowNull: false,
    comment: 'Amount that was required'
  },
  available: {
    type: DataTypes.DECIMAL(10, 6),
    allowNull: false,
    comment: 'Amount that was available'
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'Detailed warning message'
  },
  resolved: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Whether this warning has been addressed'
  },
  resolved_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When this warning was resolved'
  },
  resolved_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'ID of the user who resolved this warning'
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'inventory_warnings',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  define: {
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: {
      field: 'updated_at',
      allowNull: true
    }
  },
  indexes: [
    {
      fields: ['type']
    },
    {
      fields: ['item_id']
    },
    {
      fields: ['resolved']
    },
    {
      fields: ['created_at']
    }
  ]
});

export default InventoryWarning;
