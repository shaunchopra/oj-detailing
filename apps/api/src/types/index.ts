export interface ServiceConfig {
  label: string;
  price: number;
}

export interface AddonConfig {
  label: string;
  price: number;
}

export type VehicleType = 'car';

export interface QuotePayload {
  vehicle_type: VehicleType;
  service: string;
  name: string;
  phone: string;
  email: string;
  suburb: string;
  addons?: string | string[];
  vehicle_model?: string;
  preferred_date?: string;
  notes?: string;
  /** Honeypot field — bots fill this; humans leave it empty */
  company?: string;
  /** Customer must accept Terms & Conditions before submitting */
  terms_accepted?: boolean;
}

export interface ResolvedQuote {
  payload: QuotePayload;
  serviceData: ServiceConfig;
  selectedAddons: AddonConfig[];
  basePrice: number;
  estimatedTotal: number;
}
