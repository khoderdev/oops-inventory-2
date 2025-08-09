export type OrderStatus = "draft" | "confirmed" | "preparing" | "ready" | "served" | "paid" | "cancelled" | "complete";
export type OrderType = "delivery" | "takeaway" | "table" | "employees" | "bar";
export type TableStatus = "available" | "opened" | "reserved" | "cleaning";

export interface CreateTableData {
  number: number;
  name?: string;
  seats: number;
  shape: "round" | "square" | "rectangle";
  position: { x: number; y: number };
  section?: string;
  notes?: string;
}

export interface UpdateTableData {
  number?: number;
  name?: string;
  seats?: number;
  shape?: "round" | "square" | "rectangle";
  position?: { x: number; y: number };
  section?: string;
  notes?: string;
  status?: TableStatus;
}

export interface ReserveTableData {
  reservedBy: string;
  reservedUntil: string;
  notes?: string;
}

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

// Extended OrderItem interface with populated relationships (used when fetching from backend)
export interface OrderItemWithRelations extends OrderItem {
  menuItem?: {
    id: string;
    name: string;
    price: number;
    description?: string;
    category: string;
    unit: string;
    availableQuantity: number;
    costPerUnit: number;
    isPOSItem?: boolean;
    image?: string;
    printerId?: number | null;
    createdAt: Date;
    updatedAt: Date;
  };
  material?: {
    id: string;
    name: string;
    category: string;
    baseUnit: string;
    unitType: string;
    inputUnit?: string;
    costPerUnit: number;
    packageQuantity?: number;
    description?: string;
    isPOSItem?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
  };
}

export interface Order {
  id: string;
  employeeId?: string;
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
  discountType?: "percentage" | "fixed";
  discountValue?: number;
  discountAmount?: number;
  discountReason?: string;
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
  orderNumber?: string;
  orderType: OrderType;
  tableId?: string;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  items: Omit<OrderItem, "id">[];
  notes?: string;
  sectionId?: string;
  discountType?: "percentage" | "fixed";
  discountValue?: number;
  discountAmount?: number;
  discountReason?: string;
}

export interface UpdateOrderData {
  status?: OrderStatus;
  items?: OrderItem[];
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  notes?: string;
  estimatedReadyTime?: Date;
  discountType?: "percentage" | "fixed";
  discountValue?: number;
  discountAmount?: number;
  discountReason?: string;
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
  discountAmount: number;
  notes?: string;
}

export interface DiscountDialogProps {
  isOpen: boolean;
  onClose: () => void;
  discountAmount: number;
  onDiscountAmountChange: (amount: number) => void;
  onDiscount: () => void;
}

export interface DiscountData {
  type: "percentage" | "fixed";
  value: number;
  reason?: string;
}

export interface ExtendedDiscountDialogProps extends DiscountDialogProps {
  orderSubtotal: number;
  onApplyDiscount: (discount: DiscountData) => void;
}
