import { BTCPricePoint } from '../types';

const BINANCE_API_URL = 'https://api.binance.com/api/v3';

let cachedData: { data: BTCPricePoint[], isFallback: boolean } | null = null;

// Generate synthetic data if API fails (e.g. CORS or rate limit)
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
    const allData: BTCPricePoint[] = [];
    // Binance BTCUSDT trading started approx Aug 2017. 
    // We start a bit earlier; Binance will return the first available data.
    let startTime = 1502928000000; // August 17, 2017
    const now = Date.now();
    const limit = 1000;

    // Loop to fetch full history (Binance limits to 1000 candles per call)
    while (true) {
      if (startTime > now) break;

      const response = await fetch(
        `${BINANCE_API_URL}/klines?symbol=BTCUSDT&interval=1d&limit=${limit}&startTime=${startTime}`
      );

      if (!response.ok) {
        throw new Error(`Binance API Status: ${response.status}`);
      }

      const rawData = await response.json();

      if (!Array.isArray(rawData) || rawData.length === 0) {
        break;
      }

      // Binance format: [open_time, open, high, low, close, volume, close_time, ...]
      // We want close price (index 4) and close_time (index 0 for candle open, or index 6 for close)
      // Standard for daily charts is usually the open time of the day
      const chunk: BTCPricePoint[] = rawData.map((candle: any[]) => ({
        date: candle[0], 
        price: parseFloat(candle[4])
      }));

      allData.push(...chunk);

      // Check if we reached the end of available data
      if (rawData.length < limit) {
        break;
      }

      // Update startTime for next batch (last timestamp + 1 day in ms)
      const lastTimestamp = chunk[chunk.length - 1].date;
      startTime = lastTimestamp + 86400000; 

      // Small delay to be nice to the API
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (allData.length === 0) {
      throw new Error("No data received from Binance");
    }

    const result = { data: allData, isFallback: false };
    cachedData = result;
    return result;

  } catch (error) {
    console.warn("Binance API failed (likely CORS or Network). Using fallback data.", error);
    // Return mock data so the app doesn't crash
    const fallbackData = generateFallbackData();
    const result = { data: fallbackData, isFallback: true };
    cachedData = result;
    return result;
  }
};