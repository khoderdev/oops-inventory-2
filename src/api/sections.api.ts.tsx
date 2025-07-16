import api from "@/lib/http";
import { CreateSectionData, Section, UpdateSectionData } from "@/types/inventory";

export const sectionAPI = {
  getSections: () => api.get<Section[]>("/sections"),
  getSection: (id: string) => api.get<Section>(`/sections/${id}`),
  createSection: (sectionData: CreateSectionData) => api.post<Section, CreateSectionData>("/sections", sectionData),
  updateSection: (id: string, sectionData: UpdateSectionData) => api.put<Section, UpdateSectionData>(`/sections/${id}`, sectionData),
  deleteSection: (id: string) => api.delete<null>(`/sections/${id}`)
};
