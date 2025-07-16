import api from "@/lib/http";
import { CreateMaterialData, Material, UpdateMaterialData } from "@/types/inventory";

export const materialsAPI = {
  getMaterials: () => api.get<Material[]>("/materials"),
  getMaterial: (id: string) => api.get<Material>(`/materials/${id}`),
  createMaterial: (materialData: CreateMaterialData) => api.post<Material, CreateMaterialData>("/materials", materialData),
  updateMaterial: (id: string, materialData: UpdateMaterialData) => api.put<Material, UpdateMaterialData>(`/materials/${id}`, materialData),
  deleteMaterial: (id: string) => api.delete<null>(`/materials/${id}`)
};
