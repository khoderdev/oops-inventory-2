import { floorPlanAPI } from "@/api/floorPlan";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TablesLayoutProps } from "@/types/inventory";
import { formatCurrency } from "@/utils/conversionLogic";
import { Clock, Map, Users } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";

export const TablesLayout: React.FC<TablesLayoutProps> = ({ tables, selectedTable, onTableSelect, onClose, tableOrders = {}, onTablesUpdate }) => {
  // Ensure tables is always an array
  const safeTablesList = Array.isArray(tables) ? tables : [];

  // State for hover popup
  const [hoveredTable, setHoveredTable] = useState<Table | null>(null);
  const [popupPosition, setPopupPosition] = useState<{ x: number; y: number } | null>(null);

  // State for floor plans
  const [floorPlans, setFloorPlans] = useState<Array<{ id: number; name: string; description?: string }>>([]);
  const [selectedFloorPlan, setSelectedFloorPlan] = useState<string>("");
  const [loadingFloorPlans, setLoadingFloorPlans] = useState(false);

  // State for all furniture (for visual rendering)
  const [allFurniture, setAllFurniture] = useState<Array<{
    id: number;
    type: string;
    position: { x: number; y: number };
    dimensions?: { width: number; height: number };
    rotation?: number;
    color?: string;
    name: string;
    isClickable: boolean;
    parentId?: string;
  }>>([]);

  // Load tables from a specific floor plan
  const loadFloorPlanTables = useCallback(
    async (floorPlanId: string) => {
      try {
        console.log("Loading floor plan:", floorPlanId);
        // Load the specific floor plan with areas and furniture
        const response = await floorPlanAPI.getFloorPlan(floorPlanId);
        const floorPlan = response.data;

        console.log("Floor plan response:", floorPlan);

        if (floorPlan && floorPlan.areas) {
          // Convert furniture items to Table objects for POS system
          const tables: Table[] = [];
          // Store all furniture for visual rendering (including chairs)
          const allFurniture: Array<{
            id: number;
            type: string;
            position: { x: number; y: number };
            dimensions?: { width: number; height: number };
            rotation?: number;
            color?: string;
            name: string;
            isClickable: boolean;
            parentId?: string;
          }> = [];

          floorPlan.areas.forEach((area: { id: number; furniture?: Array<{ id: number; name: string; isTable: boolean; tableNumber?: number; seatingCapacity?: number; status?: string; type: string; position: { x: number; y: number }; dimensions?: { width: number; height: number }; rotation?: number; color?: string; parentId?: string }> }) => {
            if (area.furniture) {
              area.furniture.forEach(furniture => {
                // Add ALL furniture to visual rendering array with parent relationship info
                allFurniture.push({
                  id: furniture.id,
                  type: furniture.type,
                  position: furniture.position,
                  dimensions: furniture.dimensions,
                  rotation: furniture.rotation,
                  color: furniture.color,
                  name: furniture.name,
                  isClickable: furniture.isTable || furniture.type === "bar",
                  parentId: furniture.parentId
                });
                
                // Only create clickable "tables" for seating furniture
                const isSeatingFurniture = furniture.isTable || furniture.type === "bar";
                const hasSeatingCapacity = furniture.seatingCapacity && furniture.seatingCapacity > 0;
                
                if (isSeatingFurniture && hasSeatingCapacity) {
                  // Debug logging for furniture data
                  console.log("🪑 Processing furniture:", {
                    id: furniture.id,
                    name: furniture.name,
                    type: furniture.type,
                    position: furniture.position,
                    dimensions: furniture.dimensions,
                    rotation: furniture.rotation,
                    color: furniture.color,
                    seatingCapacity: furniture.seatingCapacity
                  });

                  // For bars without table numbers, generate one based on name or ID
                  const tableNumber = furniture.tableNumber || 
                    (furniture.type === "bar" ? (parseInt(furniture.name.replace(/\D/g, '')) || furniture.id) : furniture.id);
                  
                  const table: Table = {
                    id: furniture.id.toString(),
                    number: tableNumber,
                    seats: furniture.seatingCapacity || 4,
                    status: (furniture.status as Table["status"]) || "available",
                    shape: getTableShapeFromType(furniture.type),
                    furnitureType: furniture.type, // Store original furniture type for proper rendering
                    dimensions: furniture.dimensions, // Preserve original dimensions
                    rotation: furniture.rotation, // Preserve original rotation
                    color: furniture.color, // Preserve original color
                    position: {
                      // Convert from pixel to percentage coordinates
                      // FloorPlanCanvas typically uses an 800x600 canvas, so convert to percentage
                      // Add half the furniture dimensions to get center position
                      x: ((furniture.position.x + (furniture.dimensions?.width || 80) / 2) / 800) * 100,
                      y: ((furniture.position.y + (furniture.dimensions?.height || 80) / 2) / 600) * 100
                    }
                  };
                  
                  // Debug position conversion for bars
                  if (furniture.type === "bar") {
                    const centerX = furniture.position.x + (furniture.dimensions?.width || 80) / 2;
                    const centerY = furniture.position.y + (furniture.dimensions?.height || 80) / 2;
                    const percentX = (centerX / 800) * 100;
                    const percentY = (centerY / 600) * 100;
                    
                    console.log(`📍 Bar position conversion:`, {
                      originalPixelPos: furniture.position,
                      dimensions: furniture.dimensions,
                      centerPixelPos: { x: centerX, y: centerY },
                      finalPercentPos: { x: percentX, y: percentY }
                    });
                  }
                  
                  console.log("📋 Converted to table:", table);
                  tables.push(table);
                }
              });
            }
          });

          // Update the tables in parent component and store all furniture
          console.log("Converted tables:", tables);
          console.log("All furniture for rendering:", allFurniture);
          setAllFurniture(allFurniture);
          if (onTablesUpdate) {
            onTablesUpdate(tables);
          }
        } else {
          console.log("No areas found in floor plan");
          // If no areas/furniture, clear tables
          if (onTablesUpdate) {
            onTablesUpdate([]);
          }
        }
      } catch (error) {
        console.error("Failed to load floor plan:", error);
        // Clear tables on error
        if (onTablesUpdate) {
          onTablesUpdate([]);
        }
      }
    },
    [onTablesUpdate]
  );

  // Load floor plans on component mount
  useEffect(() => {
    const loadFloorPlans = async () => {
      setLoadingFloorPlans(true);
      try {
        const response = await floorPlanAPI.getFloorPlans();
        const plans = response.data || [];
        setFloorPlans(plans);

        // Set default floor plan if available and load its tables
        if (plans.length > 0) {
          const defaultPlan = plans.find(plan => plan.isDefault) || plans[0];
          const planId = defaultPlan.id.toString();
          setSelectedFloorPlan(planId);

          // Automatically load tables for the default floor plan
          await loadFloorPlanTables(planId);
        }
      } catch (error) {
        console.error("Failed to load floor plans:", error);
      } finally {
        setLoadingFloorPlans(false);
      }
    };

    loadFloorPlans();
  }, [loadFloorPlanTables]);

  // Handle floor plan change
  const handleFloorPlanChange = async (floorPlanId: string) => {
    setSelectedFloorPlan(floorPlanId);
    await loadFloorPlanTables(floorPlanId);
  };

  // Helper function to convert furniture type to table shape
  const getTableShapeFromType = (type: string): Table["shape"] => {
    switch (type) {
      case "round-table":
        return "round";
      case "square-table":
        return "square";
      case "rectangular-table":
        return "rectangle";
      case "bar":
        return "rectangle"; // Bars are typically rectangular
      default:
        return "square";
    }
  };

  const getTableStatusColor = (status: Table["status"]) => {
    switch (status) {
      case "available":
        return "bg-green-100 border-green-300 hover:bg-green-200";
      case "opened":
        return "bg-red-100 border-red-300 hover:bg-red-200";
      case "reserved":
        return "bg-yellow-100 border-yellow-300 hover:bg-yellow-200";
      case "cleaning":
        return "bg-gray-100 border-gray-300 hover:bg-gray-200";
      default:
        return "bg-white border-gray-200";
    }
  };

  const getTableStatusText = (status: Table["status"]) => {
    switch (status) {
      case "available":
        return "Available";
      case "opened":
        return "Open";
      case "reserved":
        return "Reserved";
      case "cleaning":
        return "Cleaning";
      default:
        return "Unknown";
    }
  };

  const getTableShape = (table: Table) => {
    const baseClasses = "flex items-center justify-center cursor-pointer transition-all duration-200 border-2";

    // Use actual dimensions from floor designer if available
    const width = table.dimensions?.width || 80;
    const height = table.dimensions?.height || 80;
    
    // Convert pixels to a reasonable scale for the TablesLayout (scale down by factor of 4)
    const scaledWidth = Math.max(width / 4, 20); // Minimum 20px width
    const scaledHeight = Math.max(height / 4, 20); // Minimum 20px height

    // Special styling for bars - make them more distinctive
    if (table.furnitureType === "bar") {
      return `${baseClasses} bg-gradient-to-r from-amber-100 to-amber-200 border-amber-400 border-2 shadow-md`;
    }

    // Regular table styling based on shape
    switch (table.shape) {
      case "round":
        return `${baseClasses} rounded-full bg-white`;
      case "square":
        return `${baseClasses} rounded-lg bg-white`;
      case "rectangle":
        return `${baseClasses} rounded-lg bg-white`;
      default:
        return `${baseClasses} rounded-lg bg-white`;
    }
  };

  const getTableStyle = (table: Table) => {
    const width = table.dimensions?.width || 80;
    const height = table.dimensions?.height || 80;
    const rotation = table.rotation || 0;
    const backgroundColor = table.color || (table.furnitureType === "bar" ? "#fef3c7" : "#ffffff");
    
    // Use different scaling for bars vs tables to maintain visual fidelity
    let scaledWidth, scaledHeight;
    
    if (table.furnitureType === "bar") {
      // For bars, use a smaller scale factor to maintain their distinctive shape
      // Also ensure minimum dimensions that preserve the bar's aspect ratio
      scaledWidth = Math.max(width / 3, 40); // Less aggressive scaling, min 40px
      scaledHeight = Math.max(height / 3, 15); // Less aggressive scaling, min 15px
    } else {
      // For regular tables, use the original scaling
      scaledWidth = Math.max(width / 4, 30); // Standard scaling
      scaledHeight = Math.max(height / 4, 30); // Standard scaling
    }
    
    const style = {
      width: `${scaledWidth}px`,
      height: `${scaledHeight}px`,
      transform: `rotate(${rotation}deg)`,
      backgroundColor,
      // Remove generic min constraints to allow bars to be thin
      ...(table.furnitureType !== "bar" && { minWidth: '30px', minHeight: '30px' })
    };
    
    // Debug logging for bar rendering
    if (table.furnitureType === "bar") {
      console.log(`🍺 Rendering bar ${table.number}:`, {
        originalDimensions: table.dimensions,
        scaledDimensions: { width: scaledWidth, height: scaledHeight },
        rotation: rotation,
        color: table.color,
        backgroundColor: backgroundColor,
        finalStyle: style
      });
    }
    
    return style;
  };

  // Type for furniture items
  type FurnitureItem = {
    id: number;
    type: string;
    position: { x: number; y: number };
    dimensions?: { width: number; height: number };
    rotation?: number;
    color?: string;
    name: string;
    isClickable: boolean;
    parentId?: string;
  };

  // Function to render any furniture piece
  const getFurnitureStyle = (furniture: FurnitureItem) => {
    const width = furniture.dimensions?.width || 40;
    const height = furniture.dimensions?.height || 40;
    const rotation = furniture.rotation || 0;
    const backgroundColor = furniture.color || getFurnitureDefaultColor(furniture.type);
    
    // Use appropriate scaling based on furniture type
    let scaledWidth, scaledHeight;
    
    if (furniture.type === "bar") {
      scaledWidth = Math.max(width / 3, 40);
      scaledHeight = Math.max(height / 3, 15);
    } else if (furniture.type === "chair") {
      scaledWidth = Math.max(width / 4, 15);
      scaledHeight = Math.max(height / 4, 15);
    } else {
      scaledWidth = Math.max(width / 4, 30);
      scaledHeight = Math.max(height / 4, 30);
    }
    
    return {
      width: `${scaledWidth}px`,
      height: `${scaledHeight}px`,
      backgroundColor,
      position: 'absolute' as const,
      left: `${((furniture.position.x + (furniture.dimensions?.width || 40) / 2) / 800) * 100}%`,
      top: `${((furniture.position.y + (furniture.dimensions?.height || 40) / 2) / 600) * 100}%`,
      transform: `translate(-50%, -50%) rotate(${rotation}deg)`
    };
  };
  
  const getFurnitureDefaultColor = (type: string) => {
    switch (type) {
      case "bar": return "#fef3c7";
      case "chair": return "#8B4513";
      case "round-table": return "#D2B48C";
      case "square-table": return "#D2B48C";
      case "rectangular-table": return "#D2B48C";
      default: return "#D3D3D3";
    }
  };
  
  const getFurnitureClasses = (furniture: FurnitureItem) => {
    const baseClasses = "border border-gray-300 flex items-center justify-center text-xs font-medium";
    
    switch (furniture.type) {
      case "bar":
        return `${baseClasses} bg-gradient-to-r from-amber-100 to-amber-200 border-amber-400 shadow-md`;
      case "chair":
        return `${baseClasses} bg-amber-800 text-white rounded-sm`;
      case "round-table":
        return `${baseClasses} bg-amber-100 rounded-full border-amber-300`;
      case "square-table":
      case "rectangular-table":
        return `${baseClasses} bg-amber-100 rounded-lg border-amber-300`;
      default:
        return `${baseClasses} bg-gray-200 rounded`;
    }
  };
  
  // Group furniture by parent-child relationships
  const groupFurniture = (furnitureList: FurnitureItem[]) => {
    const groups: { [key: string]: FurnitureItem[] } = {};
    const standalone: FurnitureItem[] = [];
    
    // First, identify all parent furniture (tables, bars)
    const parents = furnitureList.filter(f => !f.parentId && (f.isClickable || f.type === "bar"));
    
    // Create groups for each parent
    parents.forEach(parent => {
      groups[parent.id] = [parent];
    });
    
    // Add children to their parent groups
    furnitureList.forEach(furniture => {
      if (furniture.parentId && groups[furniture.parentId]) {
        groups[furniture.parentId].push(furniture);
      } else if (!furniture.parentId && !furniture.isClickable && furniture.type !== "bar") {
        standalone.push(furniture);
      }
    });
    
    return { groups, standalone };
  };
  
  const renderFurnitureGroup = (groupFurniture: FurnitureItem[], groupId: string) => {
    const parentFurniture = groupFurniture.find(f => !f.parentId);
    if (!parentFurniture) return null;
    
    const correspondingTable = safeTablesList.find(t => t.id === parentFurniture.id.toString());
    
    return (
      <div key={`group-${groupId}`} className="relative">
        {/* Render all furniture in the group */}
        {groupFurniture.map(furniture => {
          const isParent = !furniture.parentId;
          const isClickable = furniture.isClickable;
          
          return (
            <div
              key={`furniture-${furniture.id}`}
              className={`${getFurnitureClasses(furniture)} ${isClickable ? 'cursor-pointer hover:shadow-lg transition-all duration-200' : ''} ${correspondingTable && selectedTable?.id === correspondingTable.id ? 'ring-4 ring-blue-500' : ''}`}
              style={getFurnitureStyle(furniture)}
              onClick={() => {
                if (isClickable && correspondingTable) {
                  onTableSelect(correspondingTable);
                }
              }}
              onMouseEnter={(e) => {
                if (isClickable && correspondingTable) {
                  handleTableHover(correspondingTable, e);
                }
              }}
              onMouseLeave={handleTableLeave}
            >
              {isClickable && correspondingTable ? getTableContent(correspondingTable) : (
                furniture.type === "chair" ? "" : furniture.name || furniture.type
              )}
            </div>
          );
        })}
      </div>
    );
  };
  
  const renderStandaloneFurniture = (furniture: FurnitureItem) => {
    return (
      <div
        key={`standalone-${furniture.id}`}
        className={getFurnitureClasses(furniture)}
        style={getFurnitureStyle(furniture)}
      >
        {furniture.name || furniture.type}
      </div>
    );
  };

  const getTableContent = (table: Table) => {
    // Special content for bars
    if (table.furnitureType === "bar") {
      return (
        <div className="text-center">
          <div className="font-bold text-sm text-amber-800">{table.number}</div>
          <div className="text-xs text-amber-600 flex items-center justify-center">
            <Users className="w-3 h-3 mr-1" />
            {table.seats}
          </div>
          <div className="text-xs text-amber-500 font-medium">BAR</div>
        </div>
      );
    }

    // Regular table content
    return (
      <div className="text-center">
        <div className="font-bold text-lg text-gray-800">{table.number}</div>
        <div className="text-xs text-gray-600 flex items-center justify-center">
          <Users className="w-3 h-3 mr-1" />
          {table.seats}
        </div>
      </div>
    );
  };

  const formatTime = (date: Date | string) => {
    try {
      const dateObj = typeof date === "string" ? new Date(date) : date;
      if (isNaN(dateObj.getTime())) {
        return "Invalid time";
      }
      return new Intl.DateTimeFormat("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      }).format(dateObj);
    } catch (error) {
      console.error("Error formatting time:", error);
      return "Invalid time";
    }
  };

  // Handle table hover
  const handleTableHover = (table: Table, event: React.MouseEvent) => {
    if (table.status === "opened" && table.currentOrder) {
      const rect = event.currentTarget.getBoundingClientRect();
      setHoveredTable(table);
      setPopupPosition({
        x: rect.left + rect.width / 2,
        y: rect.bottom + 12
      });
    }
  };

  const handleTableLeave = () => {
    setHoveredTable(null);
    setPopupPosition(null);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl w-full h-full max-h-[100vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-center px-6 py-2 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Restaurant Tables</h2>
            {/* <p className="text-gray-600 mt-1">Select a table to start taking orders</p> */}
          </div>
        </div>

        {/* Tables Layout */}
        <div className="flex-1 overflow-auto">
          <div className="relative bg-gray-50 rounded-lg min-h-full p-4">
            {/* Restaurant Floor Plan */}
            <div className="relative w-full h-full min-h-[600px]">
              {allFurniture.length === 0 && safeTablesList.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-gray-500">
                    <div className="text-lg font-medium mb-2">No floor plan loaded</div>
                    <div className="text-sm">Please select a floor plan to view the restaurant layout.</div>
                  </div>
                </div>
              ) : (
                <>
                  {(() => {
                    const { groups, standalone } = groupFurniture(allFurniture);
                    return (
                      <>
                        {/* Render furniture groups (tables with their chairs) */}
                        {Object.entries(groups).map(([groupId, groupFurniture]) => 
                          renderFurnitureGroup(groupFurniture, groupId)
                        )}
                        
                        {/* Render standalone furniture */}
                        {standalone.map(furniture => renderStandaloneFurniture(furniture))}
                      </>
                    );
                  })()}
                  
                  {/* Render notification badges for tables with orders */}
                  {safeTablesList.map(table => {
                    const orderCount = tableOrders[table.number?.toString()];
                    if (!orderCount || orderCount <= 0) return null;
                    
                    return (
                      <div
                        key={`badge-${table.id}`}
                        className="absolute z-20"
                        style={{
                          left: `${table.position?.x || 50}%`,
                          top: `${table.position?.y || 50}%`,
                          transform: "translate(-50%, -50%) translate(20px, -20px)"
                        }}
                      >
                        <div className="bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg border-2 border-white">
                          {orderCount}
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-2 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {selectedTable ? (
                <>
                  Selected: Table {selectedTable.number} ({selectedTable.seats} seats) - {getTableStatusText(selectedTable.status)}
                </>
              ) : (
                "Select a table to continue"
              )}
            </div>

            <div className="px-6 py- border-b border-gray-100">
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded-full bg-green-100 border-2 border-green-300"></div>
                  <span className="text-sm text-gray-600">Available</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded-full bg-red-100 border-2 border-red-300"></div>
                  <span className="text-sm text-gray-600">Open</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded-full bg-yellow-100 border-2 border-yellow-300"></div>
                  <span className="text-sm text-gray-600">Reserved</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded-full bg-gray-100 border-2 border-gray-300"></div>
                  <span className="text-sm text-gray-600">Cleaning</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Floor Plan Selector */}
              <div className="flex items-center space-x-2">
                <Map className="w-4 h-4 text-gray-600" />
                <Select value={selectedFloorPlan} onValueChange={handleFloorPlanChange} disabled={loadingFloorPlans}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder={loadingFloorPlans ? "Loading plans..." : "Select floor plan"} />
                  </SelectTrigger>
                  <SelectContent>
                    {floorPlans.map(plan => (
                      <SelectItem key={plan.id} value={plan.id.toString()}>
                        <div className="flex flex-col">
                          <span className="font-medium">{plan.name}</span>
                          {plan.description && <span className="text-xs text-gray-500">{plan.description}</span>}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button onClick={() => selectedTable && onTableSelect(selectedTable)} disabled={!selectedTable || selectedTable.status === "cleaning"} className="bg-blue-600 hover:bg-blue-700">
                  {selectedTable?.status === "opened" ? "Continue Order" : "Start Order"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Popup - Positioned at top level to avoid z-index issues */}
      {hoveredTable && popupPosition && (
        <div
          className="fixed z-[9999] pointer-events-none"
          style={{
            left: popupPosition.x,
            top: popupPosition.y,
            transform: "translateX(-50%)"
          }}
        >
          <div className="relative">
            {/* Arrow pointing up */}
            <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[8px] border-r-[8px] border-b-[8px] border-l-transparent border-r-transparent border-b-white drop-shadow-sm"></div>

            {/* Card */}
            <Card className="w-52 shadow-xl border-0 bg-white backdrop-blur-sm animate-in fade-in-0 zoom-in-95 duration-200">
              <CardContent className="p-4">
                <div className="space-y-3">
                  {/* Order Number */}
                  <div className="text-center">
                    <div className="font-bold text-lg text-gray-800">{hoveredTable.currentOrder?.orderNumber || `ORD-${String(hoveredTable.currentOrder?.orderId).padStart(4, "0")}`}</div>
                  </div>

                  {/* Time */}
                  <div className="flex items-center justify-center text-gray-600">
                    <Clock className="w-4 h-4 mr-2 text-blue-500" />
                    <span className="font-medium">{formatTime(hoveredTable.currentOrder?.startTime || new Date())}</span>
                  </div>

                  {/* Items Count */}
                  <div className="flex items-center justify-center text-gray-600">
                    <div className="w-4 h-4 mr-2 rounded-full bg-orange-100 flex items-center justify-center">
                      <span className="text-xs font-bold text-orange-600">{hoveredTable.currentOrder?.itemCount || 0}</span>
                    </div>
                    <span className="font-medium">{hoveredTable.currentOrder?.itemCount || 0} items</span>
                  </div>

                  {/* Total Amount */}
                  <div className="text-center pt-2 border-t border-gray-100">
                    <div className="text-xl font-bold text-green-600">{formatCurrency(hoveredTable.currentOrder?.totalAmount || 0)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};
