import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import React from 'react';
import { FurnitureItem as FurnitureItemType } from '../types/floor-plan';

interface FurnitureItemProps {
  furniture: FurnitureItemType;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

export const FurnitureItem: React.FC<FurnitureItemProps> = ({
  furniture,
  isSelected,
  onSelect,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: furniture.id });

  const style: React.CSSProperties = {
    transition,
    transform: CSS.Transform.toString(transform),
    cursor: isDragging ? "grabbing" : "pointer",
  };

  const getFurnitureShape = () => {
    const { width, height } = furniture.dimensions;

    const baseClasses = `absolute border-2 transition-all duration-200 hover:shadow-lg ${
      isSelected ? 'border-amber-500 shadow-lg ring-2 ring-amber-200' : 'border-gray-300 hover:border-gray-400'
    }`;

    const shapeStyle = {
      width: `${width}px`,
      height: `${height}px`,
      backgroundColor: furniture.color,
      transform: `rotate(${furniture.rotation}deg)`,
    };

    switch (furniture.type) {
      case 'round-table':
        return (
          <div
            className={`${baseClasses} rounded-full`}
            style={shapeStyle}
          >
            <div className="absolute inset-2 rounded-full bg-black bg-opacity-10 flex items-center justify-center">
              <span className="text-xs font-medium text-white">{furniture.seatingCapacity}</span>
            </div>
          </div>
        );
      
      case 'square-table':
      case 'rectangular-table':
        return (
          <div
            className={`${baseClasses} rounded-lg`}
            style={shapeStyle}
          >
            <div className="absolute inset-2 rounded bg-black bg-opacity-10 flex items-center justify-center">
              <span className="text-xs font-medium text-white">{furniture.seatingCapacity}</span>
            </div>
          </div>
        );
      
      case 'chair':
        return (
          <div
            className={`${baseClasses} rounded-sm`}
            style={shapeStyle}
          >
            <div className="absolute inset-1 rounded-sm bg-black bg-opacity-20"></div>
          </div>
        );
      
      case 'booth':
        return (
          <div
            className={`${baseClasses} rounded-lg`}
            style={shapeStyle}
          >
            <div className="absolute inset-2 rounded bg-black bg-opacity-10 flex items-center justify-center">
              <span className="text-xs font-medium text-white">{furniture.seatingCapacity}</span>
            </div>
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-3/4 h-2 bg-black bg-opacity-20 rounded-b"></div>
          </div>
        );
      
      case 'bar':
        return (
          <div
            className={`${baseClasses} rounded-lg`}
            style={shapeStyle}
          >
            <div className="absolute inset-1 rounded bg-black bg-opacity-10 flex items-center justify-center">
              <span className="text-xs font-medium text-white">BAR</span>
            </div>
          </div>
        );
      
      case 'host-station':
      case 'service-station':
        return (
          <div
            className={`${baseClasses} rounded-lg`}
            style={shapeStyle}
          >
            <div className="absolute inset-2 rounded bg-black bg-opacity-10 flex items-center justify-center">
              <span className="text-xs font-medium text-white truncate px-1">
                {furniture.type === 'host-station' ? 'HOST' : 'SERVICE'}
              </span>
            </div>
          </div>
        );
      
      default:
        return (
          <div
            className={`${baseClasses} rounded-lg`}
            style={shapeStyle}
          >
          </div>
        );
    }
  };

  return (
    <div
      ref={setNodeRef}
      data-furniture-item
      style={{
        ...style,
        position: 'absolute',
        left: `${furniture.position.x}px`,
        top: `${furniture.position.y}px`,
      }}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(furniture.id);
      }}
    >
      {getFurnitureShape()}
      
      {/* Furniture name label */}
      <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 hover:opacity-100 transition-opacity whitespace-nowrap">
        {furniture.name}
      </div>
    </div>
  );
};