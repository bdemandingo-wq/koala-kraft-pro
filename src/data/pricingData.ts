// ── Car Detailing Pricing Data ──

export interface VehicleType {
  id: string;
  label: string;
  priceMultiplier: number;
}

export const vehicleTypes: VehicleType[] = [
  { id: 'sedan', label: 'Sedan', priceMultiplier: 1.0 },
  { id: 'coupe', label: 'Coupe', priceMultiplier: 1.0 },
  { id: 'suv', label: 'SUV / Crossover', priceMultiplier: 1.3 },
  { id: 'truck', label: 'Truck', priceMultiplier: 1.3 },
  { id: 'minivan', label: 'Minivan', priceMultiplier: 1.3 },
  { id: 'sports', label: 'Sports Car', priceMultiplier: 1.2 },
  { id: 'luxury', label: 'Luxury / Exotic', priceMultiplier: 1.5 },
  { id: 'rv', label: 'RV / Motorhome', priceMultiplier: 2.0 },
];

export interface VehicleCondition {
  id: number;
  label: string;
  price: number;
}

export const vehicleConditions: VehicleCondition[] = [
  { id: 1, label: 'Well Maintained', price: 0 },
  { id: 2, label: 'Light Dirt / Wear', price: 0 },
  { id: 3, label: 'Moderate — Needs Attention', price: 25 },
  { id: 4, label: 'Heavy — Neglected', price: 50 },
  { id: 5, label: 'Severe — Requires Restoration', price: 100 },
];

export interface DetailingService {
  id: string;
  name: string;
  basePrice: number;
  color: string;
  description: string;
}

export const detailingServices: DetailingService[] = [
  { id: 'express-wash', name: 'Express Wash', basePrice: 50, color: '#22c55e', description: 'Quick exterior hand wash & dry' },
  { id: 'interior-detail', name: 'Interior Detail', basePrice: 120, color: '#3b82f6', description: 'Deep interior clean, vacuum, wipe-down' },
  { id: 'exterior-detail', name: 'Exterior Detail', basePrice: 150, color: '#06b6d4', description: 'Full exterior wash, clay bar, wax' },
  { id: 'full-detail', name: 'Full Detail', basePrice: 150, color: '#8b5cf6', description: 'Complete interior & exterior detail' },
  { id: 'paint-correction', name: 'Paint Correction', basePrice: 400, color: '#f97316', description: 'Swirl removal & paint restoration' },
  { id: 'ceramic-coating', name: 'Ceramic Coating', basePrice: 600, color: '#ec4899', description: 'Professional ceramic paint protection' },
  { id: 'maintenance-wash', name: 'Maintenance Wash', basePrice: 75, color: '#14b8a6', description: 'Recurring maintenance wash for coated vehicles' },
];

export interface DetailingExtra {
  id: string;
  name: string;
  price: number;
  note?: string;
  icon?: string;
}

export const extras: DetailingExtra[] = [
  { id: 'engine-bay', name: 'Engine Bay Clean', price: 40 },
  { id: 'headlight', name: 'Headlight Restoration', price: 50 },
  { id: 'pet-hair', name: 'Pet Hair Removal', price: 30 },
  { id: 'odor', name: 'Odor Removal', price: 35 },
  { id: 'wheel-ceramic', name: 'Wheel Ceramic Coating', price: 75 },
  { id: 'trim', name: 'Trim Restoration', price: 25 },
  { id: 'leather', name: 'Leather Conditioning', price: 30 },
  { id: 'glass-coating', name: 'Glass Coating', price: 40 },
];

export interface FrequencyOption {
  id: string;
  label: string;
  discount: number;
}

export const frequencyOptions: FrequencyOption[] = [
  { id: 'one_time', label: 'One-Time', discount: 0 },
  { id: 'weekly', label: 'Weekly (30% off)', discount: 0.3 },
  { id: 'biweekly', label: 'Bi-Weekly (25% off)', discount: 0.25 },
  { id: 'monthly', label: 'Monthly (15% off)', discount: 0.15 },
];

// ── Legacy stub exports (keep existing imports from breaking) ──

export const squareFootageRanges: { label: string; maxSqFt: number }[] = [];
export const bedroomOptions: string[] = [];
export const bathroomOptions: string[] = [];
export const bedroomPricing: { bedrooms: string; bathrooms: string; basePrice: number }[] = [];
export const petOptions: { id: string; label: string; price: number }[] = [];
export const homeConditionOptions: { id: number; label: string; price: number }[] = [];

export type CleaningServiceType = string;
export interface CleaningService {
  id: string;
  name: string;
  basePrice: number;
  color: string;
  description: string;
  minimumPrice: number;
  prices: number[];
}
export const cleaningServices: CleaningService[] = [];

export function getPriceForService(_serviceId: string, _sqFtIndex: number): number { return 0; }
export function getSqFtIndexFromValue(_val: number): number { return 0; }
export function getBedroomBathroomPrice(_bedrooms: string, _bathrooms: string): number { return 0; }
export function getConditionPrice(_condition: number): number { return 0; }
export function getPetPrice(_petOption: string): number { return 0; }
