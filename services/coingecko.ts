import { BTCPricePoint } from '../types';

const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3';

let cachedData: { data: BTCPricePoint[], isFallback: boolean } | null = null;

// Generate synthetic data if API fails
const generateFallbackData = (): BTCPricePoint[] => {
  const data: BTCPricePoint[] = [];
  const now = new Date();
  // Generate 5 years of mock data
  const startDate = new Date();
  startDate.setFullYear(now.getFullYear() - 5);
  
  let price = 10000; // Approx starting price 5 years ago
  
  for (let d = new Date(startDate); d <= now; d.setDate(d.getDate() + 1)) {
    // Random walk with positive drift to simulate BTC trajectory
    const drift = 0.001; 
    const volatility = 0.03;
    const change = 1 + drift + (Math.random() * volatility * 2 - volatility);
    price = price * change;
    
    // Clamping to realistic ranges
    if (price < 3000) price = 3000;

    data.push({
      date: d.getTime(),
      price: price
    });
  }
  return data;
};

export const fetchBTCData = async (): Promise<{ data: BTCPricePoint[], isFallback: boolean }> => {
  if (cachedData) {
    return cachedData;
  }

  try {
    // Use days=max for full history. 
    // days=3650 is deprecated or less reliable on some endpoints.
    const response = await fetch(
      `${COINGECKO_API_URL}/coins/bitcoin/market_chart?vs_currency=usd&days=max&interval=daily`
    );

    if (!response.ok) {
      throw new Error(`Status: ${response.status}`);
    }

    const json = await response.json();
    
    if (!json.prices || !Array.isArray(json.prices)) {
        throw new Error("Invalid data format");
    }

    const prices: BTCPricePoint[] = json.prices.map((item: [number, number]) => ({
      date: item[0],
      price: item[1],
    }));

    const result = { data: prices, isFallback: false };
    cachedData = result;
    return result;

  } catch (error) {
    console.warn("CoinGecko API failed or rate limited. Using fallback data.", error);
    // Return mock data so the app doesn't crash
    const fallbackData = generateFallbackData();
    const result = { data: fallbackData, isFallback: true };
    cachedData = result;
    return result;
  }
};