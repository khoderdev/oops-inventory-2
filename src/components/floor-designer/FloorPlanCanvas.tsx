import { DndContext, DragEndEvent, MouseSensor, useSensor, useSensors } from "@dnd-kit/core";
import { Grid, Link, Move, ZoomIn, ZoomOut } from "lucide-react";
import React, { useCallback, useRef, useState } from "react";
import { FloorArea, FurnitureItem as FurnitureItemType } from "../../types/floor-plan";
import { autoLinkChairsToTables } from "../../utils/furniture-relationships";
import { FurnitureContextMenu } from "./FurnitureContextMenu";
import { FurnitureItem } from "./FurnitureItem";

interface FloorPlanCanvasProps {
  area: FloorArea;
  onUpdateFurniture: (furnitureId: string, updates: Partial<FurnitureItemType>) => void;
  selectedFurnitureId: string | null;
  onSelectFurniture: (id: string | null) => void;
  onLinkChairToTable: (chairId: string, tableId: string) => void;
  onUnlinkChairFromTable: (chairId: string) => void;
  onMoveTableWithChairs: (tableId: string, newPosition: { x: number; y: number }) => void;
  onDuplicateFurniture: (furnitureId: string) => void;
  onDeleteFurniture: (furnitureId: string) => void;
  getChildFurniture: (parentId: string) => FurnitureItemType[];
  getParentFurniture: (childId: string) => FurnitureItemType | null;
}

export const FloorPlanCanvas: React.FC<FloorPlanCanvasProps> = ({ area, onUpdateFurniture, selectedFurnitureId, onSelectFurniture, onLinkChairToTable, onUnlinkChairFromTable, onMoveTableWithChairs, onDuplicateFurniture, onDeleteFurniture, getChildFurniture, getParentFurniture }) => {
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [contextMenu, setContextMenu] = useState<{
    furniture: FurnitureItemType;
    position: { x: number; y: number };
  } | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);
  const isDraggingCanvas = useRef(false);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 3 // Require only 3px movement before drag starts
      }
    })
  );

  const handleZoomIn = () => {
    setScale(prev => {
      const newScale = Math.min(prev * 1.2, 3);
      // Apply pan constraints after zoom
      setTimeout(() => {
        const constraints = getPanConstraints();
        if (constraints) {
          setPan(currentPan => ({
            x: Math.max(constraints.minX, Math.min(constraints.maxX, currentPan.x)),
            y: Math.max(constraints.minY, Math.min(constraints.maxY, currentPan.y))
          }));
        }
      }, 0);
      return newScale;
    });
  };

  const handleZoomOut = () => {
    setScale(prev => {
      const newScale = Math.max(prev / 1.2, 0.3);
      // Apply pan constraints after zoom
      setTimeout(() => {
        const constraints = getPanConstraints();
        if (constraints) {
          setPan(currentPan => ({
            x: Math.max(constraints.minX, Math.min(constraints.maxX, currentPan.x)),
            y: Math.max(constraints.minY, Math.min(constraints.maxY, currentPan.y))
          }));
        }
      }, 0);
      return newScale;
    });
  };

  // Canvas panning handlers (Figma-style)
  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    // Disable panning - canvas position is now fixed
    // Only allow furniture item interactions
    const target = e.target as HTMLElement;
    const isFurnitureItem = target.closest("[data-furniture-item]") !== null;

    if (!isFurnitureItem) {
      // Prevent any canvas dragging
      e.preventDefault();
    }
  }, []);

  // Calculate pan constraints to match TablesLayout coordinate system
  const getPanConstraints = useCallback(() => {
    if (!canvasRef.current) return null;

    const rect = canvasRef.current.getBoundingClientRect();
    const viewportWidth = rect.width;
    const viewportHeight = rect.height;

    // Use the same base coordinate system as TablesLayout (800x600)
    const baseWidth = 800;
    const baseHeight = 600;
    const scaleX = rect.width / baseWidth;
    const scaleY = rect.height / baseHeight;
    const uniformScale = Math.min(scaleX, scaleY);

    const canvasWidth = baseWidth * uniformScale;
    const canvasHeight = baseHeight * uniformScale;

    // When zoomed in (scale > 1), allow reasonable panning within the coordinate system
    if (scale > 1) {
      const maxPanX = canvasWidth * scale * 0.3; // Conservative panning
      const maxPanY = canvasHeight * scale * 0.3; // Conservative panning
      return {
        minX: -maxPanX,
        maxX: maxPanX,
        minY: -maxPanY,
        maxY: maxPanY
      };
    }

    // When zoomed out, keep the canvas centered like TablesLayout
    const scaledCanvasWidth = canvasWidth * scale;
    const scaledCanvasHeight = canvasHeight * scale;

    // Center the canvas in the viewport
    const centerX = (viewportWidth - scaledCanvasWidth) / 2;
    const centerY = (viewportHeight - scaledCanvasHeight) / 2;

    const minX = Math.min(centerX, viewportWidth - scaledCanvasWidth - 20);
    const maxX = Math.max(centerX, 20);
    const minY = Math.min(centerY, viewportHeight - scaledCanvasHeight - 20);
    const maxY = Math.max(centerY, 20);

    return { minX, maxX, minY, maxY };
  }, [scale]);

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    // Panning disabled - canvas position is fixed
    // No mouse move handling needed for canvas movement
  }, []);

  const handleCanvasMouseUp = useCallback(() => {
    // Panning disabled - no need to handle mouse up for canvas movement
  }, []);

  // Global mouse up to handle mouse leaving canvas
  React.useEffect(() => {
    const handleGlobalMouseUp = () => {
      isDraggingCanvas.current = false;
      // No need to set isPanning since panning is disabled
    };

    document.addEventListener("mouseup", handleGlobalMouseUp);
    return () => document.removeEventListener("mouseup", handleGlobalMouseUp);
  }, []);

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === canvasRef.current) {
        onSelectFurniture(null);
      }
    },
    [onSelectFurniture]
  );

  // Mouse wheel zoom handler using native event listener
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      const rect = canvas.getBoundingClientRect();

      // Get mouse position relative to canvas
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Calculate zoom factor
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
      const newScale = Math.max(0.3, Math.min(3, scale * zoomFactor));

      if (newScale !== scale) {
        // Calculate the point in the canvas coordinate system
        const canvasX = (mouseX - pan.x) / scale;
        const canvasY = (mouseY - pan.y) / scale;

        // Calculate new pan to keep the mouse position fixed
        const newPan = {
          x: mouseX - canvasX * newScale,
          y: mouseY - canvasY * newScale
        };

        setScale(newScale);

        // Apply constraints and set pan
        setTimeout(() => {
          const constraints = getPanConstraints();
          if (constraints) {
            setPan({
              x: Math.max(constraints.minX, Math.min(constraints.maxX, newPan.x)),
              y: Math.max(constraints.minY, Math.min(constraints.maxY, newPan.y))
            });
          } else {
            setPan(newPan);
          }
        }, 0);
      }
    };

    // Add wheel event listener with passive: false to allow preventDefault
    canvas.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      canvas.removeEventListener("wheel", handleWheel);
    };
  }, [scale, pan, getPanConstraints]);

  const handleFurnitureRightClick = useCallback((furniture: FurnitureItemType, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    setContextMenu({
      furniture,
      position: { x: event.clientX, y: event.clientY }
    });
  }, []);

  const handleCloseContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  const handleMoveWithChairs = useCallback(
    (tableId: string) => {
      // Get the current table position and move it with chairs
      const table = area.furniture.find(f => f.id === tableId);
      if (table) {
        // Move table to its current position to trigger the move-with-chairs logic
        onMoveTableWithChairs(tableId, table.position);
      }
      setContextMenu(null);
    },
    [area.furniture, onMoveTableWithChairs]
  );

  const getAvailableTables = useCallback((): FurnitureItemType[] => {
    return area.furniture.filter(f => ["round-table", "square-table", "rectangular-table"].includes(f.type));
  }, [area.furniture]);

  const handleAutoLinkChairs = useCallback(() => {
    autoLinkChairsToTables(area.furniture, onLinkChairToTable, 80);
  }, [area.furniture, onLinkChairToTable]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event;
    const furniture = area.furniture.find(f => f.id === active.id);

    if (furniture && delta) {
      // Convert drag delta from viewport pixels to canvas coordinate system
      // The furniture container is scaled to fit the viewport, so we need to account for that scaling
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      // Get actual canvas dimensions (now responsive)
      const canvasWidth = rect.width;
      const canvasHeight = rect.height;

      // Convert delta from viewport pixels to coordinate system pixels
      // Since we're now using responsive dimensions, delta is already in the right scale
      const deltaX = delta.x / scale;
      const deltaY = delta.y / scale;

      const newPosition = {
        x: furniture.position.x + deltaX,
        y: furniture.position.y + deltaY
      };

      // Snap to grid (responsive grid size based on canvas)
      const gridSize = Math.max(10, Math.min(canvasWidth, canvasHeight) / 50); // Dynamic grid size
      newPosition.x = Math.round(newPosition.x / gridSize) * gridSize;
      newPosition.y = Math.round(newPosition.y / gridSize) * gridSize;

      // Keep furniture within the red bordered area
      // Furniture should not cross the red borders
      const minX = 0; // Left edge of red border
      const maxX = canvasWidth - furniture.dimensions.width; // Right edge minus furniture width
      const minY = 0; // Top edge of red border
      const maxY = canvasHeight - furniture.dimensions.height; // Bottom edge minus furniture height

      newPosition.x = Math.max(minX, Math.min(newPosition.x, maxX));
      newPosition.y = Math.max(minY, Math.min(newPosition.y, maxY));

      onUpdateFurniture(furniture.id, { position: newPosition });
    }
  };

  // Calculate responsive grid size based on scale
  const getGridSize = () => {
    const baseGridSize = 20;
    // Adjust grid density based on scale to maintain visibility
    if (scale < 0.5) return baseGridSize * 4;
    if (scale < 0.8) return baseGridSize * 2;
    if (scale > 2) return baseGridSize / 2;
    return baseGridSize;
  };

  const gridSize = getGridSize();

  // Calculate canvas dimensions to match TablesLayout coordinate system exactly
  const getCanvasDimensions = () => {
    // TablesLayout uses a coordinate system where:
    // - Width: 800px = 100% (furniture.position.x / 8 = percentage)
    // - Height: 600px = 100% (furniture.position.y / 6 = percentage)
    // We need to match this exact coordinate system for perfect alignment

    const baseWidth = 800; // Base coordinate system width
    const baseHeight = 600; // Base coordinate system height

    if (!canvasRef.current) {
      return { width: baseWidth, height: baseHeight };
    }

    const rect = canvasRef.current.getBoundingClientRect();

    // Scale the base coordinate system to fit the viewport while maintaining aspect ratio
    const scaleX = rect.width / baseWidth;
    const scaleY = rect.height / baseHeight;
    const uniformScale = Math.min(scaleX, scaleY);

    // Use the base coordinate system scaled to fit viewport
    const canvasWidth = baseWidth * uniformScale;
    const canvasHeight = baseHeight * uniformScale;

    return { width: canvasWidth, height: canvasHeight };
  };

  const canvasDimensions = getCanvasDimensions();

  const gridPattern = showGrid ? (
    <defs>
      <pattern id="grid" width={gridSize} height={gridSize} patternUnits="userSpaceOnUse" x="0" y="0">
        <path d={`M ${gridSize} 0 L 0 0 0 ${gridSize}`} fill="none" stroke="#e5e7eb" strokeWidth={Math.max(0.5, 1 / scale)} opacity={Math.min(1, scale * 0.8 + 0.2)} />
      </pattern>
    </defs>
  ) : null;

  return (
    <div className="flex-1 h-full bg-gray-50 relative overflow-hidden select-none">
      {/* Toolbar */}
      <div className="absolute bottom-2 right-4 z-10 bg-white rounded-lg shadow-lg border border-gray-200 p-2 flex items-center gap-2">
        <button onClick={handleZoomOut} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Zoom Out">
          <ZoomOut className="w-4 h-4" />
        </button>

        <span className="text-sm font-medium px-2 min-w-[60px] text-center">{Math.round(scale * 100)}%</span>

        <button onClick={handleZoomIn} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Zoom In">
          <ZoomIn className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-gray-300 mx-2" />

        <button onClick={() => setShowGrid(!showGrid)} className={`p-2 rounded-lg transition-colors ${showGrid ? "bg-amber-100 text-amber-700" : "hover:bg-gray-100"}`} title="Toggle Grid">
          <Grid className="w-4 h-4" />
        </button>

        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Pan Mode (Hold Alt + Click)">
          <Move className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-gray-300 mx-2" />

        <button onClick={handleAutoLinkChairs} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Auto-link chairs to nearby tables">
          <Link className="w-4 h-4" />
        </button>
      </div>

      {/* Canvas Container */}
      <div ref={canvasRef} className="w-full h-full relative overflow-hidden" onMouseDown={handleCanvasMouseDown} onMouseMove={handleCanvasMouseMove} onMouseUp={handleCanvasMouseUp} onMouseLeave={handleCanvasMouseUp} onClick={handleCanvasClick}>
        {/* Grid Background - Full Screen */}
        <div
          className="absolute inset-0"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
            transformOrigin: "0 0",
            pointerEvents: "none"
          }}
        >
          <svg
            width="100%"
            height="100%"
            className="absolute inset-0"
            preserveAspectRatio="none"
          >
            {gridPattern}
            <rect x="0" y="0" width="100%" height="100%" fill={showGrid ? "url(#grid)" : "#f9fafb"} />
          </svg>
        </div>

        {/* Furniture Layer */}
        <div
          className="absolute inset-0"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
            transformOrigin: "0 0",
            cursor: isPanning ? "cursor-grabbing" : "cursor-grab"
          }}
        >
          <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            <div
              className="relative border-2 border-red-400 w-full h-full"
            >
              {area.furniture.map(furniture => (
                <div key={furniture.id} onContextMenu={e => handleFurnitureRightClick(furniture, e)}>
                  <FurnitureItem furniture={furniture} isSelected={selectedFurnitureId === furniture.id} onSelect={onSelectFurniture} />
                </div>
              ))}
            </div>
          </DndContext>
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && <FurnitureContextMenu furniture={contextMenu.furniture} position={contextMenu.position} onClose={handleCloseContextMenu} onLinkToTable={onLinkChairToTable} onUnlinkFromTable={onUnlinkChairFromTable} onMoveWithChairs={handleMoveWithChairs} onDuplicate={onDuplicateFurniture} onDelete={onDeleteFurniture} availableTables={getAvailableTables()} childChairs={getChildFurniture(contextMenu.furniture.id)} parentTable={getParentFurniture(contextMenu.furniture.id)} />}
    </div>
  );
};
