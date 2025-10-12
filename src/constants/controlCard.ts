// Control Card Constants
export const BLOOD_TYPES = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'] as const;
export const CATEGORIES = ['C1', 'C2', 'C3'] as const;
export const DEBOUNCE_DELAY = 300;
export const MAX_INPUT_LENGTH = 60;

export type BloodType = typeof BLOOD_TYPES[number];
export type Category = typeof CATEGORIES[number];
