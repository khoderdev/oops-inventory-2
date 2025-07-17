// // import { DataTypes } from "sequelize";
// // import sequelize from "../config/database.js";

// // const Sale = sequelize.define(
// //   "Sale",
// //   {
// //     id: {
// //       type: DataTypes.INTEGER,
// //       primaryKey: true,
// //       autoIncrement: true,
// //       allowNull: false
// //     },
// //     menuItemId: {
// //       type: DataTypes.INTEGER,
// //       allowNull: true,
// //       references: {
// //         model: "menuItems",
// //         key: "id"
// //       }
// //     },
// //     saleDate: {
// //       type: DataTypes.DATE,
// //       allowNull: false,
// //       validate: {
// //         isDate: {
// //           msg: "Invalid sale date"
// //         }
// //       }
// //     },
// //     totalAmount: {
// //       type: DataTypes.FLOAT,
// //       allowNull: false,
// //       validate: {
// //         min: {
// //           args: [0],
// //           msg: "Total price cannot be negative"
// //         }
// //       }
// //     },
// //     createdAt: {
// //       type: DataTypes.DATE,
// //       allowNull: false,
// //       defaultValue: DataTypes.NOW
// //     },
// //     updatedAt: {
// //       type: DataTypes.DATE,
// //       allowNull: false,
// //       defaultValue: DataTypes.NOW
// //     }
// //   },
// //   {
// //     tableName: "Sales",
// //     timestamps: true,
// //     indexes: [
// //       {
// //         fields: ["menuItemId"]
// //       },
// //       {
// //         fields: ["saleDate"]
// //       }
// //     ]
// //   }
// // );

// // export default Sale;
// import { DataTypes } from "sequelize";
// import sequelize from "../config/database.js";

// const Sale = sequelize.define(
//   "Sale",
//   {
//     id: {
//       type: DataTypes.INTEGER,
//       primaryKey: true,
//       autoIncrement: true,
//       allowNull: false
//     },
//     saleDate: {
//       type: DataTypes.DATE,
//       allowNull: false,
//       validate: {
//         isDate: {
//           msg: "Invalid sale date"
//         }
//       }
//     },
//     totalAmount: {
//       type: DataTypes.FLOAT,
//       allowNull: false,
//       validate: {
//         min: {
//           args: [0],
//           msg: "Total price cannot be negative"
//         }
//       }
//     },
//     sectionId: {
//       type: DataTypes.STRING,
//       allowNull: false
//     },
//     items: {
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
//     tableName: "Sales",
//     timestamps: true,
//     indexes: [
//       {
//         fields: ["sectionId"]
//       },
//       {
//         fields: ["saleDate"]
//       }
//     ]
//   }
// );

// export default Sale;
import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Sale = sequelize.define(
  "Sale",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    saleDate: {
      type: DataTypes.DATE,
      allowNull: false,
      validate: {
        isDate: {
          msg: "Invalid sale date"
        }
      }
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: {
          args: [0],
          msg: "Total price cannot be negative"
        }
      }
    },
    sectionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "sections",
        key: "id"
      }
    },
    items: {
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
    tableName: "Sales",
    timestamps: true,
    indexes: [
      {
        fields: ["sectionId"]
      },
      {
        fields: ["saleDate"]
      }
    ]
  }
);

export default Sale;
