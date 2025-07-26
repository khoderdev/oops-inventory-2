export type OrderStatus = "draft" | "confirmed" | "preparing" | "ready" | "served" | "paid" | "cancelled";
export type OrderType = "delivery" | "takeaway" | "table";

export interface OrderItem {
  id: string;
  materialId?: string;
  menuItemId?: string;
  assignmentId?: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  type: "material" | "menu";
  notes?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  orderType: OrderType;
  tableId?: string;
  tableNumber?: number;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  startTime: Date;
  estimatedReadyTime?: Date;
  completedAt?: Date;
  sectionId?: string;
  userId: string;
  userRole: string;
}

export interface CreateOrderData {
  orderType: OrderType;
  tableId?: string;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  items: Omit<OrderItem, "id">[];
  notes?: string;
  sectionId?: string;
}

export interface UpdateOrderData {
  status?: OrderStatus;
  items?: OrderItem[];
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  notes?: string;
  estimatedReadyTime?: Date;
}

export interface OrderSummary {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  orderType: OrderType;
  tableNumber?: number;
  customerName?: string;
  total: number;
  itemCount: number;
  createdAt: Date;
  estimatedReadyTime?: Date;
}
