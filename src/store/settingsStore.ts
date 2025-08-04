import { atom } from 'jotai';

// System settings atoms
export const dataValidationEnabledAtom = atom<boolean>(
  // Load from localStorage, default to true
  typeof window !== 'undefined' 
    ? JSON.parse(localStorage.getItem('dataValidationEnabled') ?? 'true')
    : true
);

// Derived atom that also persists to localStorage
export const dataValidationEnabledWithPersistenceAtom = atom(
  (get) => get(dataValidationEnabledAtom),
  (get, set, newValue: boolean) => {
    set(dataValidationEnabledAtom, newValue);
    if (typeof window !== 'undefined') {
      localStorage.setItem('dataValidationEnabled', JSON.stringify(newValue));
    }
  }
);

// Other system settings can be added here in the future
export const systemSettingsAtom = atom({
  dataValidationEnabled: true,
  // Add more settings as needed
});
