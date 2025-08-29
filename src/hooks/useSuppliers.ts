import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supplierAPI } from "@/api/supplier.api";
import { Supplier, SupplierSettlement, SupplierInvoice, CreateSupplierData, UpdateSupplierData, CreateSettlementData, SuppliersQueryParams, SettlementsQueryParams } from "@/types/supplier";
import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";

// Query keys
export const supplierKeys = {
  all: ["suppliers"] as const,
  lists: () => [...supplierKeys.all, "list"] as const,
  list: (params?: SuppliersQueryParams) => [...supplierKeys.lists(), params] as const,
  details: () => [...supplierKeys.all, "detail"] as const,
  detail: (id: number | string) => [...supplierKeys.details(), id] as const,
  settlements: (supplierId: number | string) => [...supplierKeys.detail(supplierId), "settlements"] as const,
  settlementsList: (supplierId: number | string, params?: SettlementsQueryParams) => [...supplierKeys.settlements(supplierId), params] as const,
  outstandingInvoices: (supplierId: number | string) => [...supplierKeys.detail(supplierId), "outstanding-invoices"] as const,
  summary: () => [...supplierKeys.all, "summary"] as const
};

export const useSuppliers = (params?: SuppliersQueryParams) => {
  return useQuery({
    queryKey: supplierKeys.list(params),
    queryFn: () => supplierAPI.getSuppliersPaginated(params),
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};

export const useSupplier = (
  id: number | string,
  options?: {
    includeInvoices?: boolean;
    includeSettlements?: boolean;
  }
) => {
  return useQuery({
    queryKey: supplierKeys.detail(id),
    queryFn: () => supplierAPI.getSupplier(id, options),
    enabled: !!id,
    staleTime: 2 * 60 * 1000 // 2 minutes
  });
};

export const useCreateSupplier = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: supplierAPI.createSupplier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supplierKeys.lists() });
      toast({
        title: "Success",
        description: "Supplier created successfully",
        variant: "default"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to create supplier: ${error.message}`,
        variant: "destructive"
      });
    }
  });
};

export const useUpdateSupplier = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: number | string; data: UpdateSupplierData }) => supplierAPI.updateSupplier(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: supplierKeys.lists() });
      queryClient.invalidateQueries({ queryKey: supplierKeys.detail(variables.id) });
      toast({
        title: "Success",
        description: "Supplier updated successfully",
        variant: "default"
      });
    },
    onError: (error: Error, variables) => {
      toast({
        title: "Error",
        description: `Failed to update supplier: ${error.message}`,
        variant: "destructive"
      });
    }
  });
};

export const useDeleteSupplier = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: supplierAPI.deleteSupplier,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: supplierKeys.lists() });
      queryClient.removeQueries({ queryKey: supplierKeys.detail(id) });
      toast({
        title: "Success",
        description: "Supplier deleted successfully",
        variant: "default"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete supplier: ${error.message}`,
        variant: "destructive"
      });
    }
  });
};

export const useSupplierSettlements = (supplierId: number | string, params?: SettlementsQueryParams) => {
  return useQuery({
    queryKey: supplierKeys.settlementsList(supplierId, params),
    queryFn: () => supplierAPI.getSettlementsPaginated(supplierId, params),
    enabled: !!supplierId,
    staleTime: 2 * 60 * 1000 // 2 minutes
  });
};

export const useCreateSettlement = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ supplierId, data }: { supplierId: number | string; data: CreateSettlementData }) => supplierAPI.createSettlement(supplierId, data),
    onSuccess: (_, variables) => {
      // Invalidate supplier data and settlements list
      queryClient.invalidateQueries({ queryKey: supplierKeys.detail(variables.supplierId) });
      queryClient.invalidateQueries({ queryKey: supplierKeys.settlements(variables.supplierId) });
      queryClient.invalidateQueries({ queryKey: supplierKeys.outstandingInvoices(variables.supplierId) });

      toast({
        title: "Success",
        description: "Payment settlement created successfully",
        variant: "default"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to create settlement: ${error.message}`,
        variant: "destructive"
      });
    }
  });
};

export const useOutstandingInvoices = (supplierId: number | string) => {
  return useQuery({
    queryKey: supplierKeys.outstandingInvoices(supplierId),
    queryFn: () => supplierAPI.getOutstandingInvoices(supplierId),
    enabled: !!supplierId,
    staleTime: 1 * 60 * 1000 // 1 minute
  });
};

export const useBulkUpdateSupplierStatus = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: supplierAPI.bulkUpdateSupplierStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supplierKeys.lists() });
      toast({
        title: "Success",
        description: "Supplier status updated successfully",
        variant: "default"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update supplier status: ${error.message}`,
        variant: "destructive"
      });
    }
  });
};

export const useSupplierSummary = () => {
  return useQuery({
    queryKey: supplierKeys.summary(),
    queryFn: supplierAPI.getSupplierSummary,
    staleTime: 10 * 60 * 1000 // 10 minutes
  });
};

// Hook for managing supplier form state
export const useSupplierForm = (initialData?: Partial<Supplier>) => {
  const [formData, setFormData] = useState<CreateSupplierData>({
    name: initialData?.name || "",
    contactPerson: initialData?.contactPerson || "",
    email: initialData?.email || "",
    phone: initialData?.phone || "",
    address: initialData?.address || "",
    taxId: initialData?.taxId || "",
    paymentTerms: initialData?.paymentTerms || 30,
    creditLimit: initialData?.creditLimit || 0,
    notes: initialData?.notes || ""
  });

  const updateField = (field: keyof CreateSupplierData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      name: "",
      contactPerson: "",
      email: "",
      phone: "",
      address: "",
      taxId: "",
      paymentTerms: 30,
      creditLimit: 0,
      notes: ""
    });
  };

  return {
    formData,
    updateField,
    resetForm,
    setFormData
  };
};

// Hook for managing settlement form state
export const useSettlementForm = () => {
  const [formData, setFormData] = useState<CreateSettlementData>({
    amount: 0,
    paymentMethod: "cash" as const,
    referenceNumber: "",
    paymentDate: new Date().toISOString().split("T")[0],
    notes: "",
    invoiceIds: []
  });

  const updateField = (field: keyof CreateSettlementData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      amount: 0,
      paymentMethod: "cash",
      referenceNumber: "",
      paymentDate: new Date().toISOString().split("T")[0],
      notes: "",
      invoiceIds: []
    });
  };

  return {
    formData,
    updateField,
    resetForm,
    setFormData
  };
};
