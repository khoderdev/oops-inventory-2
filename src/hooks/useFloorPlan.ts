import { useCallback, useState, useRef } from 'react';
import { FloorPlan, FurnitureItem, FurnitureTemplate, Position } from '../types/floor-plan';

export const useFloorPlan = () => {
  const nextIdRef = useRef(1);
  
  const generateId = () => {
    return (nextIdRef.current++).toString();
  };

  const [currentPlan, setCurrentPlan] = useState<FloorPlan>({
    id: '1',
    name: 'New Restaurant Layout',
    areas: [
      {
        id: '1',
        name: 'Main Dining Area',
        furniture: [],
        bounds: { x: 0, y: 0, width: 800, height: 600 },
        color: '#f8fafc',
      }
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const [selectedFurnitureId, setSelectedFurnitureId] = useState<string | null>(null);

  // Generate furniture name based on type and existing count
  const generateFurnitureName = useCallback((type: string, existingFurniture: FurnitureItem[]) => {
    const typeCount = existingFurniture.filter(f => f.type === type).length + 1;
    
    switch (type) {
      case 'round-table':
        return `RT${typeCount}`;
      case 'square-table':
        return `ST${typeCount}`;
      case 'rectangular-table':
        return `T${typeCount}`;
      case 'chair':
        return `C${typeCount}`;
      case 'bar':
        return `B${typeCount}`;
      default:
        return `${type}${typeCount}`;
    }
  }, []);

  const addFurniture = useCallback((template: FurnitureTemplate, areaId: string) => {
    let newFurnitureId = '';
    
    setCurrentPlan(prev => {
      const targetArea = prev.areas.find(area => area.id === areaId);
      if (!targetArea) return prev;
      
      const furnitureName = generateFurnitureName(template.type, targetArea.furniture);
      
      const newFurniture: FurnitureItem = {
        id: generateId(),
        type: template.type,
        position: { x: 50, y: 50 },
        dimensions: { ...template.defaultDimensions },
        rotation: 0,
        color: template.defaultColor,
        seatingCapacity: template.seatingCapacity,
        name: furnitureName,
        zIndex: Date.now(),
      };
      
      newFurnitureId = newFurniture.id;

      const updatedPlan = {
        ...prev,
        areas: prev.areas.map(area => 
          area.id === areaId 
            ? { ...area, furniture: [...area.furniture, newFurniture] }
            : area
        ),
        updatedAt: new Date(),
      };
      
      // Auto-save to localStorage
      setTimeout(() => {
        localStorage.setItem(`floor-plan-${updatedPlan.id}`, JSON.stringify(updatedPlan));
      }, 0);
      
      return updatedPlan;
    });

    setSelectedFurnitureId(newFurnitureId);
  }, [generateFurnitureName]);

  const updateFurniture = useCallback((furnitureId: string, updates: Partial<FurnitureItem>) => {
    setCurrentPlan(prev => {
      const updatedPlan = {
        ...prev,
        areas: prev.areas.map(area => ({
          ...area,
          furniture: area.furniture.map(f => 
            f.id === furnitureId ? { ...f, ...updates } : f
          )
        })),
        updatedAt: new Date(),
      };
      
      // Auto-save to localStorage
      setTimeout(() => {
        localStorage.setItem(`floor-plan-${updatedPlan.id}`, JSON.stringify(updatedPlan));
      }, 0);
      
      return updatedPlan;
    });
  }, []);

  const deleteFurniture = useCallback((furnitureId: string) => {
    setCurrentPlan(prev => {
      // Get child furniture before deletion
      const childIds = prev.areas
        .flatMap(area => area.furniture)
        .filter(f => f.parentId === furnitureId)
        .map(f => f.id);
      
      const updatedPlan = {
        ...prev,
        areas: prev.areas.map(area => ({
          ...area,
          furniture: area.furniture.filter(f => 
            f.id !== furnitureId && !childIds.includes(f.id)
          )
        })),
        updatedAt: new Date(),
      };
      
      // Auto-save to localStorage
      setTimeout(() => {
        localStorage.setItem(`floor-plan-${updatedPlan.id}`, JSON.stringify(updatedPlan));
      }, 0);
      
      return updatedPlan;
    });
    
    if (selectedFurnitureId === furnitureId) {
      setSelectedFurnitureId(null);
    }
  }, [selectedFurnitureId]);

  const duplicateFurniture = useCallback((furnitureId: string) => {
    const furniture = currentPlan.areas
      .flatMap(area => area.furniture)
      .find(f => f.id === furnitureId);
    
    if (furniture) {
      const newFurniture: FurnitureItem = {
        ...furniture,
        id: generateId(),
        position: { 
          x: furniture.position.x + 20, 
          y: furniture.position.y + 20 
        },
        name: `${furniture.name} Copy`,
        zIndex: Date.now(),
      };

      setCurrentPlan(prev => ({
        ...prev,
        areas: prev.areas.map(area => 
          area.furniture.some(f => f.id === furnitureId)
            ? { ...area, furniture: [...area.furniture, newFurniture] }
            : area
        ),
        updatedAt: new Date(),
      }));

      setSelectedFurnitureId(newFurniture.id);
    }
  }, [currentPlan]);

  const getSavedPlans = useCallback((): FloorPlan[] => {
    try {
      const saved = localStorage.getItem('saved-floor-plans');
      if (saved) {
        const plans = JSON.parse(saved);
        return plans.map((plan: FloorPlan) => ({
          ...plan,
          createdAt: new Date(plan.createdAt),
          updatedAt: new Date(plan.updatedAt),
        }));
      }
    } catch (error) {
      console.error('Error loading saved plans:', error);
    }
    return [];
  }, []);

  const savePlan = useCallback((name: string) => {
    const updatedPlan = {
      ...currentPlan,
      name,
      updatedAt: new Date(),
    };
    
    setCurrentPlan(updatedPlan);
    
    // Save to localStorage
    localStorage.setItem(`floor-plan-${updatedPlan.id}`, JSON.stringify(updatedPlan));
    
    // Update the list of saved plans
    const savedPlansList = getSavedPlans();
    const existingIndex = savedPlansList.findIndex(p => p.id === updatedPlan.id);
    
    if (existingIndex >= 0) {
      savedPlansList[existingIndex] = updatedPlan;
    } else {
      savedPlansList.push(updatedPlan);
    }
    
    localStorage.setItem('saved-floor-plans', JSON.stringify(savedPlansList));
  }, [currentPlan, getSavedPlans]);

  const deleteSavedPlan = useCallback((planId: string) => {
    // Remove from localStorage
    localStorage.removeItem(`floor-plan-${planId}`);
    
    // Update the list of saved plans
    const savedPlansList = getSavedPlans().filter(p => p.id !== planId);
    localStorage.setItem('saved-floor-plans', JSON.stringify(savedPlansList));
  }, [getSavedPlans]);

  const loadPlan = useCallback((plan: FloorPlan) => {
    // Parse dates if they're strings (from localStorage)
    const loadedPlan = {
      ...plan,
      createdAt: typeof plan.createdAt === 'string' ? new Date(plan.createdAt) : plan.createdAt,
      updatedAt: typeof plan.updatedAt === 'string' ? new Date(plan.updatedAt) : plan.updatedAt,
    };
    
    setCurrentPlan(loadedPlan);
    setSelectedFurnitureId(null);
    
    // Update the ID counter to avoid conflicts
    const maxId = Math.max(
      parseInt(loadedPlan.id) || 0,
      ...loadedPlan.areas.map(area => parseInt(area.id) || 0),
      ...loadedPlan.areas.flatMap(area => area.furniture.map(f => parseInt(f.id) || 0))
    );
    nextIdRef.current = maxId + 1;
  }, []);

  const newPlan = useCallback(() => {
    nextIdRef.current = 1; // Reset counter for new plan
    const plan: FloorPlan = {
      id: generateId(),
      name: 'New Restaurant Layout',
      areas: [
        {
          id: generateId(),
          name: 'Main Dining Area',
          furniture: [],
          bounds: { x: 0, y: 0, width: 800, height: 600 },
          color: '#f8fafc',
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    setCurrentPlan(plan);
    setSelectedFurnitureId(null);
  }, []);



  const linkChairToTable = useCallback((chairId: string, tableId: string) => {
    setCurrentPlan(prev => {
      const updatedPlan = {
        ...prev,
        areas: prev.areas.map(area => ({
          ...area,
          furniture: area.furniture.map(f => 
            f.id === chairId ? { ...f, parentId: tableId } : f
          )
        })),
        updatedAt: new Date(),
      };
      
      // Auto-save to localStorage
      setTimeout(() => {
        localStorage.setItem(`floor-plan-${updatedPlan.id}`, JSON.stringify(updatedPlan));
      }, 0);
      
      return updatedPlan;
    });
  }, []);

  const unlinkChairFromTable = useCallback((chairId: string) => {
    setCurrentPlan(prev => {
      const updatedPlan = {
        ...prev,
        areas: prev.areas.map(area => ({
          ...area,
          furniture: area.furniture.map(f => 
            f.id === chairId ? { ...f, parentId: undefined } : f
          )
        })),
        updatedAt: new Date(),
      };
      
      // Auto-save to localStorage
      setTimeout(() => {
        localStorage.setItem(`floor-plan-${updatedPlan.id}`, JSON.stringify(updatedPlan));
      }, 0);
      
      return updatedPlan;
    });
  }, []);

  const getChildFurniture = useCallback((parentId: string): FurnitureItem[] => {
    return currentPlan.areas
      .flatMap(area => area.furniture)
      .filter(f => f.parentId === parentId);
  }, [currentPlan]);

  const getParentFurniture = useCallback((childId: string): FurnitureItem | null => {
    const child = currentPlan.areas
      .flatMap(area => area.furniture)
      .find(f => f.id === childId);
    
    if (!child?.parentId) return null;
    
    return currentPlan.areas
      .flatMap(area => area.furniture)
      .find(f => f.id === child.parentId) || null;
  }, [currentPlan]);

  const moveTableWithChairs = useCallback((tableId: string, newPosition: Position) => {
    const table = currentPlan.areas
      .flatMap(area => area.furniture)
      .find(f => f.id === tableId);
    
    if (!table) return;
    
    const chairs = getChildFurniture(tableId);
    const deltaX = newPosition.x - table.position.x;
    const deltaY = newPosition.y - table.position.y;
    
    setCurrentPlan(prev => {
      const updatedPlan = {
        ...prev,
        areas: prev.areas.map(area => ({
          ...area,
          furniture: area.furniture.map(f => {
            if (f.id === tableId) {
              return { ...f, position: newPosition };
            }
            if (chairs.some(chair => chair.id === f.id)) {
              return {
                ...f,
                position: {
                  x: f.position.x + deltaX,
                  y: f.position.y + deltaY
                }
              };
            }
            return f;
          })
        })),
        updatedAt: new Date(),
      };
      
      // Auto-save to localStorage
      setTimeout(() => {
        localStorage.setItem(`floor-plan-${updatedPlan.id}`, JSON.stringify(updatedPlan));
      }, 0);
      
      return updatedPlan;
    });
  }, [currentPlan, getChildFurniture]);

  const selectedFurniture = currentPlan.areas
    .flatMap(area => area.furniture)
    .find(f => f.id === selectedFurnitureId) || null;

  return {
    currentPlan,
    selectedFurniture,
    selectedFurnitureId,
    setSelectedFurnitureId,
    addFurniture,
    updateFurniture,
    deleteFurniture,
    duplicateFurniture,
    savePlan,
    loadPlan,
    newPlan,
    getSavedPlans,
    deleteSavedPlan,
    linkChairToTable,
    unlinkChairFromTable,
    getChildFurniture,
    getParentFurniture,
    moveTableWithChairs,
  };
};