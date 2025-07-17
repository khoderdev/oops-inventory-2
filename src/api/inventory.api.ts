import { assignmentsAPI } from "./assignments.api";
import { materialsAPI } from "./matierials.api.ts.tsx";
import { menuAPI } from "./menu.api.ts.tsx";
import { sectionAPI } from "./sections.api.ts.tsx";
import { stockAPI } from "./stock.api.ts.tsx";

export const inventoryAPI = {
  materials: materialsAPI,
  stock: stockAPI,
  menu: menuAPI,
  sections: sectionAPI,
  assignments: assignmentsAPI
};

export { assignmentsAPI, materialsAPI, menuAPI, sectionAPI, stockAPI };
