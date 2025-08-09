import api from "@/lib/http";
import { Printer } from "@/types/inventory";

export const printersAPI = {
  getPrinters: () => api.get<{ success: boolean; printers: Printer[] }>("/printers"),
  getPrinter: (id: string | number) => api.get<Printer>(`/printers/${id}`),
  createPrinter: (printerData: Omit<Printer, "id" | "createdAt" | "updatedAt">) => api.post<Printer, Omit<Printer, "id" | "createdAt" | "updatedAt">>("/printers", printerData),
  updatePrinter: (id: string | number, printerData: Partial<Omit<Printer, "id" | "createdAt" | "updatedAt">>) => api.put<Printer, Partial<Omit<Printer, "id" | "createdAt" | "updatedAt">>>(`/printers/${id}`, printerData),
  deletePrinter: (id: string | number) => api.delete<null>(`/printers/${id}`),
  testPrinter: (id: string | number) => api.post<{ success: boolean; message: string }, Record<string, never>>(`/printers/${id}/test`, {})
};
