import { AddonConfig, ServiceConfig } from '../types/index.js';

export const SERVICES: Record<string, ServiceConfig> = {
  'touch-up':        { label: 'Touch Up',                     car: 80,  caravan: null },
  'tier-1-exterior': { label: 'Tier 1 \u2014 Exterior',       car: 65,  caravan: 200  },
  'tier-2-interior': { label: 'Tier 2 \u2014 Interior',       car: 150, caravan: 320  },
  'tier-3-complete': { label: 'Tier 3 \u2014 Complete Detail', car: 200, caravan: 495  },
};

export const ADDONS: Record<string, AddonConfig> = {
  'scratch-removal':       { label: 'Scratch removal',       price: 45  },
  'trim-restoration':      { label: 'Trim restoration',      price: 50  },
  'water-repellent':       { label: 'Water repellent',       price: 30  },
  'anti-fog':              { label: 'Anti-fog',              price: 35  },
  'headlight-restoration': { label: 'Headlight restoration', price: 100 },
};

export const RECIPIENT = 'ojdservice1@gmail.com';
