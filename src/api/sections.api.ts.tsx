import api from "@/lib/http";
import { CreateInnerSectionData, CreateSectionData, CreateTableData, InnerSection, Section, UpdateInnerSectionData, UpdateSectionData } from "@/types/inventory";

export const sectionAPI = {
  // Section Operations
  getSections: () => api.get<Section[]>("/sections"),
  getSection: (id: string) => api.get<Section>(`/sections/${id}`),
  createSection: (sectionData: CreateSectionData) => api.post<Section, CreateSectionData>("/sections", sectionData),
  updateSection: (id: string, sectionData: UpdateSectionData) => api.put<Section, UpdateSectionData>(`/sections/${id}`, sectionData),
  deleteSection: (id: string) => api.delete<null>(`/sections/${id}`),

  // Inner Section Operations
  getInnerSections: async () => {
    return api.get("sections/inner-sections");
  },
  getInnerSection: (id: string) => api.get<InnerSection>(`sections/inner-sections/by-id/${id}`),
  createInnerSection: (innerSectionData: CreateInnerSectionData) => api.post<InnerSection, CreateInnerSectionData>("/sections/inner-sections", innerSectionData),
  updateInnerSection: (id: string, innerSectionData: UpdateInnerSectionData) => api.put<InnerSection, UpdateInnerSectionData>(`/sections/inner-sections/${id}`, innerSectionData),
  deleteInnerSection: (id: string) => api.delete<null>(`/sections/inner-sections/${id}`)
};

export const tablesAPI = {
  getTables: async () => {
    console.log("Fetching all tables from /tables");
    return api.get("sections/tables");
  },
  getTableById: async (id: string) => {
    console.log(`Attempting to fetch table with ID: ${id}`);
    if (!id || id === "undefined" || isNaN(parseInt(id))) {
      console.error(`Invalid table ID provided: ${id}`);
      throw new Error("Valid table ID is required");
    }
    return api.get(`sections/tables/${id}`);
  },
  createTable: async (data: CreateTableData) => {
    return api.post("sections/tables", data);
  },
  updateTable: async (id: string, data: CreateTableData) => {
    if (!id || id === "undefined" || isNaN(parseInt(id))) {
      console.error(`Invalid table ID for update: ${id}`);
      throw new Error("Valid table ID is required");
    }
    return api.put(`sections/tables/${id}`, data);
  },
  deleteTable: async (id: string) => {
    if (!id || id === "undefined" || isNaN(parseInt(id))) {
      console.error(`Invalid table ID for delete: ${id}`);
      throw new Error("Valid table ID is required");
    }
    return api.delete(`sections/tables/${id}`);
  }
};

// export const tablesAPI = {
//   // Table Operations
//   getTables: (innerSectionId: string) => api.get<Tables[]>(`/sections/tables/${innerSectionId}`),
//   getTable: (id: string) => api.get<Tables>(`/sections/tables/by-id/${id}`),
//   createTable: (tableData: CreateTableData) => api.post<Tables, CreateTableData>("/sections/tables", tableData),
//   updateTable: (id: string, tableData: UpdateTableData) => api.put<Tables, UpdateTableData>(`/sections/tables/${id}`, tableData),
//   deleteTable: (id: string) => api.delete<null>(`/sections/tables/${id}`)
// };
