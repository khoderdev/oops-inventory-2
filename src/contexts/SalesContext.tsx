import React, { createContext, useContext, useReducer, ReactNode } from "react";
import { NegativeStockReport, RevertSaleResponse, SaleRecord, SaleResponse } from "@/types/inventory";
import { salesAPI } from "@/api/sales.api.ts";

// State interface
interface SalesState {
  sales: SaleRecord[];
  staffSales: SaleRecord[];
  currentSale: SaleRecord | null;
  negativeStockReport: NegativeStockReport | null;
  loading: boolean;
  error: string | null;
}

// Action types
type SalesAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_SALES"; payload: SaleRecord[] }
  | { type: "SET_STAFF_SALES"; payload: SaleRecord[] }
  | { type: "SET_CURRENT_SALE"; payload: SaleRecord | null }
  | { type: "SET_NEGATIVE_STOCK_REPORT"; payload: NegativeStockReport | null }
  | { type: "ADD_SALE"; payload: SaleRecord }
  | { type: "UPDATE_SALE"; payload: SaleRecord }
  | { type: "DELETE_SALE"; payload: string }
  | { type: "DELETE_SALE_ITEMS"; payload: { saleId: string; deletedItemIds: string[] } }
  | { type: "DELETE_SALE_ITEM"; payload: { saleId: string; itemId: string } }
  | { type: "REVERT_SALE"; payload: string };

// Context interface
interface SalesContextType extends SalesState {
  // Data fetching
  fetchSales: () => Promise<void>;
  fetchStaffSales: () => Promise<void>;
  fetchSale: (id: string) => Promise<void>;
  fetchNegativeStockReport: () => Promise<void>;

  // CRUD operations
  createSale: (saleData: SaleRecord) => Promise<SaleResponse>;
  updateSale: (id: string, saleData: SaleRecord) => Promise<SaleRecord>;
  deleteSale: (id: string) => Promise<void>;
  deleteSaleItems: (saleId: string, itemIds: string[], itemType: "material" | "menu") => Promise<void>;
  deleteSaleItem: (saleId: string, itemId: string, itemType: "material" | "menu") => Promise<void>;
  revertSale: (id: string) => Promise<RevertSaleResponse>;
  softDeleteSale: (saleId: string, itemId?: string, itemType?: "material" | "menu") => Promise<void>;

  // Utility
  clearError: () => void;
  clearCurrentSale: () => void;
}

// Initial state
const initialState: SalesState = {
  sales: [],
  staffSales: [],
  currentSale: null,
  negativeStockReport: null,
  loading: false,
  error: null
};

// Reducer
const salesReducer = (state: SalesState, action: SalesAction): SalesState => {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload, loading: false };
    case "SET_SALES":
      return { ...state, sales: action.payload, loading: false, error: null };
    case "SET_STAFF_SALES":
      return { ...state, staffSales: action.payload, loading: false, error: null };
    case "SET_CURRENT_SALE":
      return { ...state, currentSale: action.payload, loading: false, error: null };
    case "SET_NEGATIVE_STOCK_REPORT":
      return { ...state, negativeStockReport: action.payload, loading: false, error: null };
    case "ADD_SALE":
      return { ...state, sales: [action.payload, ...state.sales], loading: false, error: null };
    case "UPDATE_SALE":
      return {
        ...state,
        sales: state.sales.map(sale => (sale.id === action.payload.id ? action.payload : sale)),
        currentSale: state.currentSale?.id === action.payload.id ? action.payload : state.currentSale,
        loading: false,
        error: null
      };
    case "DELETE_SALE":
      return {
        ...state,
        sales: state.sales.filter(sale => sale.id !== action.payload),
        loading: false,
        error: null
      };
    case "DELETE_SALE_ITEMS":
      return {
        ...state,
        sales: state.sales.map(sale =>
          sale.id === action.payload.saleId
            ? {
                ...sale,
                items: sale.items?.filter(item => !action.payload.deletedItemIds.includes(item.id))
              }
            : sale
        ),
        loading: false,
        error: null
      };
    case "DELETE_SALE_ITEM":
      return {
        ...state,
        sales: state.sales.map(sale =>
          sale.id === action.payload.saleId
            ? {
                ...sale,
                items: sale.items?.filter(item => item.id !== action.payload.itemId)
              }
            : sale
        ),
        loading: false,
        error: null
      };
    case "REVERT_SALE":
      return {
        ...state,
        sales: state.sales.filter(sale => sale.id !== action.payload),
        loading: false,
        error: null
      };
    default:
      return state;
  }
};

// Create context
const SalesContext = createContext<SalesContextType | undefined>(undefined);

// Provider component
interface SalesProviderProps {
  children: ReactNode;
}

export const SalesProvider: React.FC<SalesProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(salesReducer, initialState);

  const setLoading = (loading: boolean) => dispatch({ type: "SET_LOADING", payload: loading });
  const setError = (error: string | null) => dispatch({ type: "SET_ERROR", payload: error });

  // Data fetching methods
  const fetchSales = async () => {
    setLoading(true);
    try {
      const response = await salesAPI.getSales();
      dispatch({ type: "SET_SALES", payload: response.data });
    } catch (error: any) {
      setError(error.response?.data?.message || "Failed to fetch sales");
    }
  };

  const fetchStaffSales = async () => {
    setLoading(true);
    try {
      const response = await salesAPI.getStaffSales();
      dispatch({ type: "SET_STAFF_SALES", payload: response.data });
    } catch (error: any) {
      setError(error.response?.data?.message || "Failed to fetch staff sales");
    }
  };

  const fetchSale = async (id: string) => {
    setLoading(true);
    try {
      const response = await salesAPI.getSale(id);
      dispatch({ type: "SET_CURRENT_SALE", payload: response.data });
    } catch (error: any) {
      setError(error.response?.data?.message || "Failed to fetch sale");
    }
  };

  const fetchNegativeStockReport = async () => {
    setLoading(true);
    try {
      const response = await salesAPI.getNegativeStockReport();
      dispatch({ type: "SET_NEGATIVE_STOCK_REPORT", payload: response.data });
    } catch (error: any) {
      setError(error.response?.data?.message || "Failed to fetch negative stock report");
    }
  };

  // CRUD operations
  const createSale = async (saleData: SaleRecord): Promise<SaleResponse> => {
    setLoading(true);
    try {
      const response = await salesAPI.createSale(saleData);
      dispatch({ type: "ADD_SALE", payload: saleData });
      return response.data;
    } catch (error: any) {
      setError(error.response?.data?.message || "Failed to create sale");
      throw error;
    }
  };

  const updateSale = async (id: string, saleData: SaleRecord): Promise<SaleRecord> => {
    setLoading(true);
    try {
      const response = await salesAPI.updateSale(id, saleData);
      dispatch({ type: "UPDATE_SALE", payload: response.data });
      return response.data;
    } catch (error: any) {
      setError(error.response?.data?.message || "Failed to update sale");
      throw error;
    }
  };

  const deleteSale = async (id: string) => {
    setLoading(true);
    try {
      await salesAPI.deleteSale(id);
      dispatch({ type: "DELETE_SALE", payload: id });
    } catch (error: any) {
      setError(error.response?.data?.message || "Failed to delete sale");
      throw error;
    }
  };

  const deleteSaleItems = async (saleId: string, itemIds: string[], itemType: "material" | "menu") => {
    setLoading(true);
    try {
      await salesAPI.deleteSaleItems(saleId, itemIds, itemType);
      dispatch({ type: "DELETE_SALE_ITEMS", payload: { saleId, deletedItemIds: itemIds } });
    } catch (error: any) {
      setError(error.response?.data?.message || "Failed to delete sale items");
      throw error;
    }
  };

  const deleteSaleItem = async (saleId: string, itemId: string, itemType: "material" | "menu") => {
    setLoading(true);
    try {
      await salesAPI.deleteSaleItem(saleId, itemId, itemType);
      dispatch({ type: "DELETE_SALE_ITEM", payload: { saleId, itemId } });
    } catch (error: any) {
      setError(error.response?.data?.message || "Failed to delete sale item");
      throw error;
    }
  };

  const revertSale = async (id: string): Promise<RevertSaleResponse> => {
    setLoading(true);
    try {
      const response = await salesAPI.revertSale(id);
      dispatch({ type: "REVERT_SALE", payload: id });
      return response.data;
    } catch (error: any) {
      setError(error.response?.data?.message || "Failed to revert sale");
      throw error;
    }
  };

  const softDeleteSale = async (saleId: string, itemId?: string, itemType?: "material" | "menu") => {
    setLoading(true);
    try {
      await salesAPI.softDeleteSale(saleId, itemId, itemType);
      if (!itemId) {
        dispatch({ type: "DELETE_SALE", payload: saleId });
      }
      // For item deletion, we'd need to handle it specifically based on your API response
    } catch (error: any) {
      setError(error.response?.data?.message || "Failed to soft delete sale");
      throw error;
    }
  };

  // Utility methods
  const clearError = () => setError(null);
  const clearCurrentSale = () => dispatch({ type: "SET_CURRENT_SALE", payload: null });

  // Context value
  const contextValue: SalesContextType = {
    ...state,
    fetchSales,
    fetchStaffSales,
    fetchSale,
    fetchNegativeStockReport,
    createSale,
    updateSale,
    deleteSale,
    deleteSaleItems,
    deleteSaleItem,
    revertSale,
    softDeleteSale,
    clearError,
    clearCurrentSale
  };

  return <SalesContext.Provider value={contextValue}>{children}</SalesContext.Provider>;
};

// Custom hook to use the context
export const useSales = (): SalesContextType => {
  const context = useContext(SalesContext);
  if (context === undefined) {
    throw new Error("useSales must be used within a SalesProvider");
  }
  return context;
};
