export interface Position {
  x: number;
  y: number;
}

export interface Dimensions {
  width: number;
  height: number;
}

export interface FurnitureItem {
  id: string;
  type: FurnitureType;
  position: Position;
  dimensions: Dimensions;
  rotation: number;
  color: string;
  seatingCapacity?: number;
  name: string;
  zIndex: number;
  parentId?: string;
}

export type FurnitureType = "round-table" | "square-table" | "rectangular-table" | "chair" | "bar";

export interface FloorArea {
  id: string;
  name: string;
  furniture: FurnitureItem[];
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  color: string;
}

export interface FloorPlan {
  id: string;
  name: string;
  areas: FloorArea[];
  createdAt: Date;
  updatedAt: Date;
}

export interface FurnitureTemplate {
  type: FurnitureType;
  name: string;
  icon: string;
  defaultDimensions: Dimensions;
  defaultColor: string;
  seatingCapacity?: number;
  category: "seating" | "tables" | "service";
}

// Backend response types
export interface BackendFurnitureItem {
  id: number;
  designerItemId: string;
  type: FurnitureType;
  name: string;
  position: { x: number; y: number };
  dimensions: { width: number; height: number };
  rotation: number;
  color: string;
  seatingCapacity?: number;
  zIndex: number;
  parentId?: string;
  isTable: boolean;
  tableNumber?: number;
  status: string;
  isActive: boolean;
}

export interface BackendFloorArea {
  id: number;
  name: string;
  bounds: { x: number; y: number; width: number; height: number };
  color: string;
  section: string;
  furniture?: BackendFurnitureItem[];
}

export interface BackendFloorPlan {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  areas?: BackendFloorArea[];
}

export interface CreateFloorPlanRequest {
  name: string;
  description?: string;
  areas: {
    name: string;
    bounds: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    color?: string;
    section?: string;
    furniture: {
      id: string;
      type: string;
      name: string;
      position: { x: number; y: number };
      dimensions: { width: number; height: number };
      rotation?: number;
      color?: string;
      seatingCapacity?: number;
      zIndex?: number;
      parentId?: string;
      tableNumber?: number;
    }[];
  }[];
  isDefault?: boolean;
}

export interface UpdateFloorPlanRequest extends CreateFloorPlanRequest {
  id: string;
}

export interface FloorPlanResponse {
  data: BackendFloorPlan;
}

export interface FloorPlansResponse {
  data: BackendFloorPlan[];
}

export interface FloorPlanTablesResponse {
  data: {
    id: number;
    number: number;
    name: string;
    seats: number;
    status: string;
    shape: string;
    position: { x: number; y: number };
    section: string;
    isActive: boolean;
    furnitureItemId: number;
    designerItemId: string;
    isFloorPlanTable: boolean;
    currentOrder?: {
      orderId: string;
      orderNumber: string;
      customerName?: string;
      startTime: string;
      totalAmount: number;
      itemCount: number;
    };
  }[];
}
