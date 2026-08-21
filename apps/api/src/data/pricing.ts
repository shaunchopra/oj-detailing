import { AddonConfig, ServiceConfig } from '../types/index.js';

export const SERVICES: Record<string, ServiceConfig> = {
  'interior-package':      { label: 'Interior Package',            price: 170 },
  'complete-detail':       { label: 'Complete Detail',             price: 240 },
  'transformation-detail': { label: 'Transformation Detail',       price: 300 },
  'monthly-maintenance':   { label: 'Monthly Maintenance Package', price: 100 },
};

export const ADDONS: Record<string, AddonConfig> = {
  'scratch-removal':       { label: 'Scratch removal',       price: 45  },
  'trim-restoration':      { label: 'Trim restoration',      price: 50  },
  'water-repellent':       { label: 'Water repellent',       price: 30  },
  'anti-fog':              { label: 'Anti fog',              price: 35  },
  'headlight-restoration': { label: 'Headlight restoration', price: 100 },
  'water-spot-remover':    { label: 'Water spot remover',    price: 50  },
};

export const RECIPIENT = 'ojdservice1@gmail.com';
