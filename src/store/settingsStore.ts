import { atom } from 'jotai';

// Get initial value from localStorage
const getInitialValidationSetting = (): boolean => {
  if (typeof window === 'undefined') return true;
  try {
    const stored = localStorage.getItem('dataValidationEnabled');
    return stored ? JSON.parse(stored) : true;
  } catch {
    return true;
  }
};

// Main atom with persistence
export const dataValidationEnabledAtom = atom(
  getInitialValidationSetting(),
  (get, set, newValue: boolean) => {
    set(dataValidationEnabledAtom, newValue);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('dataValidationEnabled', JSON.stringify(newValue));
      } catch (error) {
        console.warn('Failed to save validation setting to localStorage:', error);
      }
    }
  }
);

// Alias for backward compatibility
export const dataValidationEnabledWithPersistenceAtom = dataValidationEnabledAtom;

// Other system settings can be added here in the future
export const systemSettingsAtom = atom({
  dataValidationEnabled: true
  // Add more settings as needed
});
