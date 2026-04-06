export type StyleSignal = {
  garment_type: string;        // e.g. "blouse", "jeans", "coat"
  decade_range: string;        // e.g. "1970s-1980s"
  silhouette: string;          // e.g. "A-line", "straight", "wrap"
  dominant_colors: string[];   // e.g. ["burnt orange", "cream"]
  fabric_indicators: string[]; // e.g. ["sheer", "structured"]
  search_keywords: string[];   // generated keywords for API queries
};
