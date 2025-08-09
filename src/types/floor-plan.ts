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

export type FurnitureType = 
  | 'round-table'
  | 'square-table' 
  | 'rectangular-table'
  | 'chair'
  | 'booth'
  | 'bar'
  | 'host-station'
  | 'service-station';

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
  category: 'seating' | 'tables' | 'service';
}