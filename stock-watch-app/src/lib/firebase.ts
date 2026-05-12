import { initializeApp } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { getAuth } from 'firebase/auth';

// Firebase configuration (shared with AgentQu)
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const functions = getFunctions(app, 'us-central1');
export const auth = getAuth(app);

// Enable offline persistence (suppress errors if already enabled)
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('Firestore persistence unavailable: multiple tabs open');
  } else if (err.code === 'unimplemented') {
    console.warn('Firestore persistence unavailable: browser not supported');
  }
});

// Stock API functions
const FUNCTIONS_BASE_URL = process.env.REACT_APP_FUNCTIONS_BASE_URL || 'https://us-central1-agentqu-platform.cloudfunctions.net';

/**
 * Call a stock cloud function
 */
export async function callStockFunction<T>(name: string, data: Record<string, unknown> = {}): Promise<T> {
  const response = await fetch(`${FUNCTIONS_BASE_URL}/${name}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Function ${name} failed: ${response.statusText}`);
  }

  return response.json();
}

// Export specific function callers
export const stockApi = {
  discoverStocks: (params: Record<string, unknown>) =>
    callStockFunction('discoverStocks', params),

  analyzeStock: (symbol: string, userId?: string) =>
    callStockFunction('analyzeStock', { symbol, userId }),

  searchStocks: (query: string) =>
    callStockFunction('searchStocks', { query }),

  getMarketOverview: () =>
    callStockFunction('getMarketOverview'),

  getWatchlist: (userId: string) =>
    callStockFunction('getWatchlist', { userId }),

  addToWatchlist: (userId: string, symbol: string) =>
    callStockFunction('addToWatchlist', { userId, symbol }),

  removeFromWatchlist: (userId: string, symbol: string) =>
    callStockFunction('removeFromWatchlist', { userId, symbol }),

  getPortfolio: (userId: string) =>
    callStockFunction('getPortfolio', { userId }),

  addToPortfolio: (userId: string, holding: Record<string, unknown>) =>
    callStockFunction('addToPortfolio', { userId, ...holding }),

  sellFromPortfolio: (userId: string, symbol: string, shares: number, price: number) =>
    callStockFunction('sellFromPortfolio', { userId, symbol, shares, price }),

  savePreferences: (userId: string, preferences: Record<string, unknown>) =>
    callStockFunction('saveStockPreferences', { userId, ...preferences }),

  getPreferences: (userId: string) =>
    callStockFunction('getStockPreferences', { userId }),
};

console.log('📈 AgentQu Stocks - Firebase initialized');
