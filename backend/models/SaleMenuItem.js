// import { DataTypes } from "sequelize";
// import sequelize from "../config/database.js";
// import { MenuItem } from "./menuItems.js";
// import Sale from "./sale.js";

// const SaleMenuItem = sequelize.define(
//   "SaleMenuItem",
//   {
//     id: {
//       type: DataTypes.INTEGER,
//       primaryKey: true,
//       autoIncrement: true,
//       allowNull: false
//     },
//     saleId: {
//       type: DataTypes.INTEGER,
//       allowNull: false,
//       references: {
//         model: "Sale",
//         key: "id"
//       }
//     },
//     menuItemId: {
//       type: DataTypes.INTEGER,
//       allowNull: false,
//       references: {
//         model: "MenuItem",
//         key: "id"
//       }
//     },
//     quantity: {
//       type: DataTypes.INTEGER,
//       allowNull: false,
//       validate: {
//         min: {
//           args: [1],
//           msg: "Quantity must be at least 1"
//         }
//       }
//     },
//     unitPrice: {
//       type: DataTypes.FLOAT,
//       allowNull: false,
//       validate: {
//         min: {
//           args: [0],
//           msg: "Unit price cannot be negative"
//         }
//       }
//     },
//     totalPrice: {
//       type: DataTypes.FLOAT,
//       allowNull: false,
//       validate: {
//         min: {
//           args: [0],
//           msg: "Total price cannot be negative"
//         }
//       }
//     },
//     ingredients: {
//       type: DataTypes.JSON,
//       allowNull: true,
//       defaultValue: []
//     },
//     createdAt: {
//       type: DataTypes.DATE,
//       allowNull: false,
//       defaultValue: DataTypes.NOW
//     },
//     updatedAt: {
//       type: DataTypes.DATE,
//       allowNull: false,
//       defaultValue: DataTypes.NOW
//     }
//   },
//   {
//     tableName: "SaleMenuItems",
//     timestamps: true,
//     indexes: [
//       {
//         fields: ["saleId"]
//       },
//       {
//         fields: ["menuItemId"]
//       }
//     ]
//   }
// );

// // Define associations
// Sale.hasMany(SaleMenuItem, { as: "menuItems", foreignKey: "saleId" });
// SaleMenuItem.belongsTo(Sale, { as: "sale", foreignKey: "saleId" });
// SaleMenuItem.belongsTo(MenuItem, { as: "menuItem", foreignKey: "menuItemId" });

// export default SaleMenuItem;
import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const SaleMenuItem = sequelize.define(
  "SaleMenuItem",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    saleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Sales",
        key: "id"
      }
    },
    menuItemId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "menuItems",
        key: "id"
      }
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: {
          args: [1],
          msg: "Quantity must be at least 1"
        }
      }
    },
    unitPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: {
          args: [0],
          msg: "Unit price cannot be negative"
        }
      }
    },
    totalPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: {
          args: [0],
          msg: "Total price cannot be negative"
        }
      }
    },
    ingredients: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: []
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  },
  {
    tableName: "SaleMenuItems",
    timestamps: true,
    indexes: [
      {
        fields: ["saleId"]
      },
      {
        fields: ["menuItemId"]
      }
    ]
  }
);

export default SaleMenuItem;
