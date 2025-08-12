import { atom } from 'jotai';

// Get initial value for validation setting: default OFF, respect stored value if present
const getInitialValidationSetting = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    const stored = localStorage.getItem('dataValidationEnabled');
    return stored ? JSON.parse(stored) : false;
  } catch {
    return false;
  }
};

// Main atom with persistence
export const dataValidationEnabledAtom = atom(
  getInitialValidationSetting(),
  (_get, set, newValue: boolean) => {
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
  dataValidationEnabled: false
  // Add more settings as needed
});
