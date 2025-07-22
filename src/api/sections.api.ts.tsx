import api from "@/lib/http";
import { CreateInnerSectionData, CreateSectionData, CreateTableData, InnerSection, Section, Tables, UpdateInnerSectionData, UpdateSectionData, UpdateTableData } from "@/types/inventory";

export const sectionAPI = {
  // Section Operations
  getSections: () => api.get<Section[]>("/sections"),
  getSection: (id: string) => api.get<Section>(`/sections/${id}`),
  createSection: (sectionData: CreateSectionData) => api.post<Section, CreateSectionData>("/sections", sectionData),
  updateSection: (id: string, sectionData: UpdateSectionData) => api.put<Section, UpdateSectionData>(`/sections/${id}`, sectionData),
  deleteSection: (id: string) => api.delete<null>(`/sections/${id}`),

  // Inner Section Operations
  getInnerSections: (sectionId: string) => api.get<InnerSection[]>(`sections/inner-sections/${sectionId}`),
  getInnerSection: (id: string) => api.get<InnerSection>(`sections/inner-sections/by-id/${id}`),
  createInnerSection: (innerSectionData: CreateInnerSectionData) => api.post<InnerSection, CreateInnerSectionData>("/sections/inner-sections", innerSectionData),
  updateInnerSection: (id: string, innerSectionData: UpdateInnerSectionData) => api.put<InnerSection, UpdateInnerSectionData>(`/sections/inner-sections/${id}`, innerSectionData),
  deleteInnerSection: (id: string) => api.delete<null>(`/sections/inner-sections/${id}`),

  // Table Operations
  getTables: (innerSectionId: string) => api.get<Tables[]>(`/sections/tables/${innerSectionId}`),
  getTable: (id: string) => api.get<Tables>(`/sections/tables/by-id/${id}`),
  createTable: (tableData: CreateTableData) => api.post<Tables, CreateTableData>("/sections/tables", tableData),
  updateTable: (id: string, tableData: UpdateTableData) => api.put<Tables, UpdateTableData>(`/sections/tables/${id}`, tableData),
  deleteTable: (id: string) => api.delete<null>(`/sections/tables/${id}`)
};
