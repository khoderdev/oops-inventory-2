/**
 * Debug Helpers
 * 
 * Utility functions for debugging Redux Persist and data serialization issues
 */

/**
 * Checks if an object is serializable for Redux
 * @param obj The object to check
 * @returns True if the object is serializable, false otherwise
 */
export function isSerializable(obj: any): boolean {
  // Check for primitive types
  if (obj === undefined || obj === null || 
      typeof obj === 'boolean' || 
      typeof obj === 'number' || 
      typeof obj === 'string') {
    return true;
  }

  // Check for Date objects (which need special handling)
  if (obj instanceof Date) {
    return !isNaN(obj.getTime());
  }

  // Check for arrays
  if (Array.isArray(obj)) {
    return obj.every(item => isSerializable(item));
  }

  // Check for plain objects
  if (typeof obj === 'object') {
    // Reject non-plain objects
    if (obj.constructor !== Object) {
      return false;
    }
    
    // Check each property
    return Object.keys(obj).every(key => isSerializable(obj[key]));
  }

  // Reject functions, symbols, etc.
  return false;
}

/**
 * Find non-serializable paths in an object
 * @param obj The object to check
 * @param path Current path (for recursion)
 * @returns Array of paths to non-serializable values
 */
export function findNonSerializablePaths(obj: any, path: string = ''): string[] {
  const nonSerializablePaths: string[] = [];

  // Check primitive types
  if (obj === undefined || obj === null || 
      typeof obj === 'boolean' || 
      typeof obj === 'number' || 
      typeof obj === 'string') {
    return nonSerializablePaths;
  }

  // Check for Date objects
  if (obj instanceof Date) {
    if (isNaN(obj.getTime())) {
      nonSerializablePaths.push(`${path} (Invalid Date)`);
    }
    return nonSerializablePaths;
  }

  // Check for functions, symbols, etc.
  if (typeof obj === 'function' || typeof obj === 'symbol') {
    nonSerializablePaths.push(`${path} (${typeof obj})`);
    return nonSerializablePaths;
  }

  // Check for non-plain objects
  if (typeof obj === 'object' && !Array.isArray(obj) && obj !== null && obj.constructor !== Object) {
    nonSerializablePaths.push(`${path} (${obj.constructor.name})`);
    return nonSerializablePaths;
  }

  // Check arrays
  if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      const itemPath = path ? `${path}[${index}]` : `[${index}]`;
      nonSerializablePaths.push(...findNonSerializablePaths(item, itemPath));
    });
    return nonSerializablePaths;
  }

  // Check object properties
  if (typeof obj === 'object' && obj !== null) {
    Object.entries(obj).forEach(([key, value]) => {
      const propPath = path ? `${path}.${key}` : key;
      nonSerializablePaths.push(...findNonSerializablePaths(value, propPath));
    });
  }

  return nonSerializablePaths;
}

/**
 * Safely stringify an object for debugging
 * @param obj The object to stringify
 * @returns A string representation of the object
 */
export function safeStringify(obj: any): string {
  try {
    return JSON.stringify(obj, (key, value) => {
      if (typeof value === 'function') {
        return '[Function]';
      }
      if (typeof value === 'symbol') {
        return value.toString();
      }
      if (value instanceof Date) {
        return `Date(${value.toISOString()})`;
      }
      if (typeof value === 'object' && value !== null && value.constructor !== Object && !Array.isArray(value)) {
        return `[${value.constructor.name}]`;
      }
      return value;
    }, 2);
  } catch (error) {
    return `[Unstringifiable Object: ${error}]`;
  }
}

/**
 * Log Redux action with detailed debugging
 * @param action The Redux action
 */
export function debugReduxAction(action: any): void {
  console.group(`🔍 Redux Action: ${action.type}`);
  
  console.log('Action:', action);
  
  if (action.payload) {
    console.log('Payload:', action.payload);
    
    if (!isSerializable(action.payload)) {
      console.warn('⚠️ Non-serializable payload detected!');
      const paths = findNonSerializablePaths(action.payload);
      console.warn('Non-serializable paths:', paths);
    }
  }
  
  console.groupEnd();
}

/**
 * Debug Redux Persist state
 * @param state The Redux state
 */
export function debugPersistState(state: any): void {
  console.group('🔍 Redux Persist State Debug');
  
  const nonSerializablePaths = findNonSerializablePaths(state);
  
  if (nonSerializablePaths.length > 0) {
    console.warn('⚠️ Non-serializable state detected!');
    console.warn('Non-serializable paths:', nonSerializablePaths);
  } else {
    console.log('✅ State is fully serializable');
  }
  
  console.groupEnd();
}
