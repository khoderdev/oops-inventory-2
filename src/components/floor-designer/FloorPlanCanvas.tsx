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
  const lastPanPoint = useRef({ x: 0, y: 0 });
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
      // Adjust pan if needed after zoom
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
      // Adjust pan if needed after zoom
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
    // Start panning if clicking on canvas background (not on furniture items)
    if (e.button === 0 && !e.defaultPrevented) {
      const target = e.target as HTMLElement;

      // Check if we're NOT clicking on a furniture item
      const isFurnitureItem = target.closest("[data-furniture-item]") !== null;

      if (!isFurnitureItem) {
        isDraggingCanvas.current = true;
        setIsPanning(true);
        lastPanPoint.current = { x: e.clientX, y: e.clientY };
        e.preventDefault();
      }
    }
  }, []);

  // Calculate pan constraints based on zoom level and canvas bounds
  const getPanConstraints = useCallback(() => {
    if (!canvasRef.current) return null;

    const rect = canvasRef.current.getBoundingClientRect();
    const viewportWidth = rect.width;
    const viewportHeight = rect.height;

    // When zoomed in (scale > 1), allow more freedom to explore
    if (scale > 1) {
      const maxPanX = area.bounds.width * scale * 0.5;
      const maxPanY = area.bounds.height * scale * 0.5;
      return {
        minX: -maxPanX,
        maxX: maxPanX,
        minY: -maxPanY,
        maxY: maxPanY
      };
    }

    // When zoomed out, constrain to keep content visible
    const scaledAreaWidth = area.bounds.width * scale;
    const scaledAreaHeight = area.bounds.height * scale;

    // Calculate constraints to keep the floor plan area within viewport
    const minX = Math.min(0, viewportWidth - scaledAreaWidth - 50); // 50px margin
    const maxX = Math.max(0, 50); // 50px margin
    const minY = Math.min(0, viewportHeight - scaledAreaHeight - 50);
    const maxY = Math.max(0, 50);

    return { minX, maxX, minY, maxY };
  }, [scale, area.bounds.width, area.bounds.height]);

  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isPanning && isDraggingCanvas.current) {
        const deltaX = e.clientX - lastPanPoint.current.x;
        const deltaY = e.clientY - lastPanPoint.current.y;

        setPan(prev => {
          const newPan = {
            x: prev.x + deltaX,
            y: prev.y + deltaY
          };

          // Apply constraints
          const constraints = getPanConstraints();
          if (constraints) {
            newPan.x = Math.max(constraints.minX, Math.min(constraints.maxX, newPan.x));
            newPan.y = Math.max(constraints.minY, Math.min(constraints.maxY, newPan.y));
          }

          return newPan;
        });

        lastPanPoint.current = { x: e.clientX, y: e.clientY };
      }
    },
    [isPanning, getPanConstraints]
  );

  const handleCanvasMouseUp = useCallback(() => {
    isDraggingCanvas.current = false;
    setIsPanning(false);
  }, []);

  // Global mouse up to handle mouse leaving canvas
  React.useEffect(() => {
    const handleGlobalMouseUp = () => {
      isDraggingCanvas.current = false;
      setIsPanning(false);
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
    return area.furniture.filter(f => ["round-table", "square-table", "rectangular-table", "booth"].includes(f.type));
  }, [area.furniture]);

  const handleAutoLinkChairs = useCallback(() => {
    autoLinkChairsToTables(area.furniture, onLinkChairToTable, 80);
  }, [area.furniture, onLinkChairToTable]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event;
    const furniture = area.furniture.find(f => f.id === active.id);

    if (furniture && delta) {
      const newPosition = {
        x: furniture.position.x + delta.x / scale,
        y: furniture.position.y + delta.y / scale
      };

      // Snap to grid (10px grid)
      const gridSize = 10;
      newPosition.x = Math.round(newPosition.x / gridSize) * gridSize;
      newPosition.y = Math.round(newPosition.y / gridSize) * gridSize;

      // Keep within bounds
      newPosition.x = Math.max(0, Math.min(newPosition.x, area.bounds.width - furniture.dimensions.width));
      newPosition.y = Math.max(0, Math.min(newPosition.y, area.bounds.height - furniture.dimensions.height));

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

  // Calculate canvas dimensions to ensure grid covers entire viewport
  const getCanvasDimensions = () => {
    if (!canvasRef.current) return { width: area.bounds.width * 2, height: area.bounds.height * 2 };

    const rect = canvasRef.current.getBoundingClientRect();
    const viewportWidth = rect.width;
    const viewportHeight = rect.height;

    // Calculate the dimensions needed to cover the entire viewport at current scale and pan
    const scaledViewportWidth = viewportWidth / scale;
    const scaledViewportHeight = viewportHeight / scale;

    // Add significant padding to ensure grid extends well beyond visible area
    const padding = Math.max(scaledViewportWidth, scaledViewportHeight) * 2;

    const totalWidth = Math.max(area.bounds.width * 3, scaledViewportWidth + Math.abs(pan.x / scale) + padding);
    const totalHeight = Math.max(area.bounds.height * 3, scaledViewportHeight + Math.abs(pan.y / scale) + padding);

    return { width: totalWidth, height: totalHeight };
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
    <div className="flex-1 bg-gray-50 relative overflow-hidden select-none">
      {/* Toolbar */}
      <div className="absolute top-2 right-4 z-10 bg-white rounded-lg shadow-lg border border-gray-200 p-2 flex items-center gap-2">
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

      {/* Scale indicator */}
      <div className="absolute bottom-4 left-4 z-10 bg-white rounded-lg shadow-lg border border-gray-200 p-3">
        <div className="text-xs text-gray-600 mb-1">Scale: 1 inch = 2px</div>
        <div className="flex items-center gap-2">
          <div className="w-20 h-px bg-gray-400"></div>
          <span className="text-xs text-gray-600">10 inches</span>
        </div>
      </div>

      {/* Canvas Container */}
      <div ref={canvasRef} className="w-full h-full relative overflow-hidden" onMouseDown={handleCanvasMouseDown} onMouseMove={handleCanvasMouseMove} onMouseUp={handleCanvasMouseUp} onMouseLeave={handleCanvasMouseUp} onClick={handleCanvasClick}>
        {/* Grid Background */}
        <div
          className="absolute inset-0"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
            transformOrigin: "0 0",
            pointerEvents: "none"
          }}
        >
          <svg
            width={canvasDimensions.width}
            height={canvasDimensions.height}
            className="absolute"
            style={{
              left: -canvasDimensions.width * 0.25,
              top: -canvasDimensions.height * 0.25,
              minWidth: "100%",
              minHeight: "100%"
            }}
            preserveAspectRatio="none"
          >
            {gridPattern}
            <rect x="0" y="0" width={canvasDimensions.width} height={canvasDimensions.height} fill={showGrid ? "url(#grid)" : "#f9fafb"} />
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
            <div className="relative w-full h-full">
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
