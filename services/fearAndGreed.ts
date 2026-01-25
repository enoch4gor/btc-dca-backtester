import { FearGreedPoint } from '../types';

const API_URL = 'https://api.alternative.me/fng/?limit=0';

export const fetchFearAndGreedData = async (): Promise<FearGreedPoint[]> => {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error('Failed to fetch Fear & Greed index');
    }
    const json = await response.json();
    
    // The API returns data in descending order (newest first).
    // Structure: { data: [{ value: "55", value_classification: "Greed", timestamp: "1517443200" }, ...] }
    
    if (!json.data || !Array.isArray(json.data)) {
        return [];
    }

    const points: FearGreedPoint[] = json.data.map((item: any) => ({
      // API timestamp is in seconds, convert to ms
      date: parseInt(item.timestamp, 10) * 1000, 
      value: parseInt(item.value, 10),
      classification: item.value_classification
    })).sort((a: FearGreedPoint, b: FearGreedPoint) => a.date - b.date); // Sort ascending

    return points;
  } catch (error) {
    console.warn("Error fetching Fear & Greed data:", error);
    return [];
  }
};