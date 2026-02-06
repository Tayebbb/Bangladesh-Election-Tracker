// Major political parties of Bangladesh
// Colors and symbols can be customized

import { Party } from '@/types';

export const parties: Party[] = [
  {
    id: 'al',
    name: 'Bangladesh Awami League',
    shortName: 'AL',
    color: '#00A651', // Green
    symbol: '⛵', // Boat
    order: 1,
  },
  {
    id: 'bnp',
    name: 'Bangladesh Nationalist Party',
    shortName: 'BNP',
    color: '#E4002B', // Red
    symbol: '🌾', // Sheaf of Paddy
    order: 2,
  },
  {
    id: 'jp-ershad',
    name: 'Jatiya Party (Ershad)',
    shortName: 'JP',
    color: '#FFD700', // Gold
    symbol: '🌻', // Plough (represented as sunflower)
    order: 3,
  },
  {
    id: 'jamaat',
    name: 'Bangladesh Jamaat-e-Islami',
    shortName: 'JI',
    color: '#006400', // Dark Green
    symbol: '⚖️', // Scale
    order: 4,
  },
  {
    id: 'jp-manju',
    name: 'Jatiya Party (Manju)',
    shortName: 'JP-M',
    color: '#FFA500', // Orange
    symbol: '🌻',
    order: 5,
  },
  {
    id: 'workers-party',
    name: "Workers Party of Bangladesh",
    shortName: 'WP',
    color: '#DC143C', // Crimson
    symbol: '⭐',
    order: 6,
  },
  {
    id: 'jasod',
    name: 'Jatiya Samajtantrik Dal',
    shortName: 'JSD',
    color: '#8B0000', // Dark Red
    symbol: '✊',
    order: 7,
  },
  {
    id: 'bikalpa-dhara',
    name: 'Bikalpa Dhara Bangladesh',
    shortName: 'BDB',
    color: '#4169E1', // Royal Blue
    symbol: '🔷',
    order: 8,
  },
  {
    id: 'gono-forum',
    name: 'Gono Forum',
    shortName: 'GF',
    color: '#9370DB', // Medium Purple
    symbol: '🏠',
    order: 9,
  },
  {
    id: 'ldf',
    name: 'Liberal Democratic Party',
    shortName: 'LDP',
    color: '#20B2AA', // Light Sea Green
    symbol: '📖',
    order: 10,
  },
  {
    id: 'independent',
    name: 'Independent',
    shortName: 'IND',
    color: '#6B7280', // Gray
    symbol: '👤',
    order: 99,
  },
  {
    id: 'other',
    name: 'Others',
    shortName: 'OTH',
    color: '#9CA3AF', // Light Gray
    symbol: '❓',
    order: 100,
  },
];

// Get party by ID
export function getPartyById(partyId: string): Party | undefined {
  return parties.find(p => p.id === partyId);
}

// Get party color with fallback
export function getPartyColor(partyId: string): string {
  return getPartyById(partyId)?.color || '#6B7280';
}

// Get main competing parties (for highlighting top 2)
export function getMainParties(): Party[] {
  return parties.filter(p => ['al', 'bnp'].includes(p.id));
}

// Party ID to display name map for quick lookup
export const partyNames: Record<string, string> = parties.reduce(
  (acc, party) => ({ ...acc, [party.id]: party.shortName }),
  {}
);
