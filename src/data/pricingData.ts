// Car detailing pricing data

export const vehicleTypes = [
  { id: 'sedan', label: 'Sedan', priceMultiplier: 1.0 },
  { id: 'coupe', label: 'Coupe', priceMultiplier: 1.0 },
  { id: 'suv', label: 'SUV / Crossover', priceMultiplier: 1.3 },
  { id: 'truck', label: 'Truck', priceMultiplier: 1.3 },
  { id: 'minivan', label: 'Minivan', priceMultiplier: 1.3 },
  { id: 'sports', label: 'Sports Car', priceMultiplier: 1.2 },
  { id: 'luxury', label: 'Luxury / Exotic', priceMultiplier: 1.5 },
  { id: 'rv', label: 'RV / Motorhome', priceMultiplier: 2.0 },
];

export const vehicleConditions = [
  { id: 1, label: '1 - Well Maintained', price: 0 },
  { id: 2, label: '2 - Light Dirt / Wear', price: 0 },
  { id: 3, label: '3 - Moderate — Needs Attention', price: 25 },
  { id: 4, label: '4 - Heavy — Neglected', price: 50 },
  { id: 5, label: '5 - Severe — Requires Restoration', price: 100 },
];

export type ServiceType =
  | 'express_wash'
  | 'interior_detail'
  | 'exterior_detail'
  | 'full_detail'
  | 'paint_correction'
  | 'ceramic_coating'
  | 'maintenance_wash';

export interface DetailingService {
  id: ServiceType;
  name: string;
  description: string;
  color: string;
  basePrice: number;
}

export const detailingServices: DetailingService[] = [
  {
    id: 'express_wash',
    name: 'Express Wash',
    description: 'Quick exterior wash, tire dress, and window clean',
    color: '#10b981',
    basePrice: 50,
  },
  {
    id: 'interior_detail',
    name: 'Interior Detail',
    description: 'Full vacuum, wipe-down, leather/vinyl clean, and air freshener',
    color: '#3b82f6',
    basePrice: 120,
  },
  {
    id: 'exterior_detail',
    name: 'Exterior Detail',
    description: 'Hand wash, clay bar, polish, and sealant application',
    color: '#06b6d4',
    basePrice: 150,
  },
  {
    id: 'full_detail',
    name: 'Full Detail',
    description: 'Complete interior and exterior detailing package',
    color: '#8b5cf6',
    basePrice: 250,
  },
  {
    id: 'paint_correction',
    name: 'Paint Correction',
    description: 'Multi-step machine polish to remove swirls and scratches',
    color: '#f97316',
    basePrice: 400,
  },
  {
    id: 'ceramic_coating',
    name: 'Ceramic Coating',
    description: 'Long-lasting ceramic protection with paint correction prep',
    color: '#ec4899',
    basePrice: 600,
  },
  {
    id: 'maintenance_wash',
    name: 'Maintenance Wash',
    description: 'Gentle wash for coated vehicles to maintain protection',
    color: '#14b8a6',
    basePrice: 75,
  },
];

export const extras = [
  { id: 'engine_bay', name: 'Engine Bay Clean', price: 40, note: '', icon: 'Cog' },
  { id: 'headlight_restore', name: 'Headlight Restoration', price: 50, note: '', icon: 'Lightbulb' },
  { id: 'pet_hair', name: 'Pet Hair Removal', price: 30, note: '', icon: 'PawPrint' },
  { id: 'odor_removal', name: 'Odor Removal', price: 35, note: '', icon: 'Wind' },
  { id: 'wheel_coating', name: 'Wheel Ceramic Coating', price: 75, note: '', icon: 'Circle' },
  { id: 'trim_restore', name: 'Trim Restoration', price: 25, note: '', icon: 'Sparkles' },
  { id: 'leather_condition', name: 'Leather Conditioning', price: 30, note: '', icon: 'Armchair' },
  { id: 'glass_coating', name: 'Glass Coating', price: 40, note: '', icon: 'Glasses' },
];

export const frequencyOptions = [
  { id: 'one_time', label: 'One-Time', discount: 0 },
  { id: 'weekly', label: 'Weekly (30% off)', discount: 0.30 },
  { id: 'biweekly', label: 'Bi-Weekly (25% off)', discount: 0.25 },
  { id: 'monthly', label: 'Monthly (15% off)', discount: 0.15 },
];

// Legacy exports - kept for backward compatibility with components that still reference them
// These map to empty/stub values so they don't break existing code
export const squareFootageRanges: { label: string; maxSqFt: number }[] = [];
export const bedroomOptions: string[] = [];
export const bathroomOptions: string[] = [];
export const bedroomPricing: { bedrooms: string; bathrooms: string; basePrice: number }[] = [];
export const petOptions: { id: string; label: string; price: number }[] = [];
export const homeConditionOptions: { id: number; label: string; price: number }[] = [];
export type CleaningServiceType = string;
export interface CleaningService {
  id: CleaningServiceType;
  name: string;
  description: string;
  color: string;
  minimumPrice: number;
  prices: number[];
}
export const cleaningServices: CleaningService[] = [];

export function getPriceForService(): number { return 0; }
export function getSqFtIndexFromValue(): number { return 0; }
export function getBedroomBathroomPrice(): number { return 0; }
export function getConditionPrice(condition: number): number {
  const option = vehicleConditions.find(o => o.id === condition);
  return option?.price || 0;
}
export function getPetPrice(): number { return 0; }
