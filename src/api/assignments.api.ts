import api from "@/lib/http";
import { CreateSectionAssignmentData, SectionAssignment, UpdateSectionAssignmentData } from "@/types/inventory";

export const assignmentsAPI = {
  getAssignments: () => api.get<SectionAssignment[]>("/assignments"),
  getAssignment: (id: string) => api.get<SectionAssignment>(`/assignments/${id}`),
  getAssignmentsBySection: (sectionId: string) => api.get<SectionAssignment[]>(`/assignments/section/${sectionId}`),
  createAssignment: (assignmentData: CreateSectionAssignmentData) => api.post<SectionAssignment, CreateSectionAssignmentData>("/assignments", assignmentData),
  updateAssignment: (id: string, assignmentData: UpdateSectionAssignmentData) => api.put<SectionAssignment, UpdateSectionAssignmentData>(`/assignments/${id}`, assignmentData),
  deleteAssignment: (id: string) => api.delete<null>(`/assignments/${id}`)
};
