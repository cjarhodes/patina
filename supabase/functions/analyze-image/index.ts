import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Style signal extraction: maps Vision API labels to vintage-relevant signals
const GARMENT_MAP: Record<string, string> = {
  dress: 'dress', blouse: 'blouse', shirt: 'shirt', top: 'top',
  jacket: 'jacket', coat: 'coat', blazer: 'blazer', cardigan: 'cardigan',
  sweater: 'sweater', jeans: 'jeans', trousers: 'trousers', pants: 'pants',
  skirt: 'skirt', shorts: 'shorts', jumpsuit: 'jumpsuit', romper: 'romper',
  't-shirt': 'tee', 'polo shirt': 'polo',
};

const SILHOUETTE_MAP: Record<string, string> = {
  'a-line': 'A-line', flared: 'flared', 'straight-leg': 'straight',
  'wide-leg': 'wide-leg', fitted: 'fitted', oversized: 'oversized',
  wrap: 'wrap', shift: 'shift', midi: 'midi', maxi: 'maxi', mini: 'mini',
};

// Vintage color name mapping — closest vintage terminology to RGB
const VINTAGE_COLORS: Array<{ name: string; r: number; g: number; b: number }> = [
  { name: 'burnt orange', r: 204, g: 85, b: 0 },
  { name: 'harvest gold', r: 218, g: 165, b: 32 },
  { name: 'avocado green', r: 86, g: 130, b: 3 },
  { name: 'mustard yellow', r: 225, g: 173, b: 1 },
  { name: 'rust', r: 183, g: 65, b: 14 },
  { name: 'mauve', r: 224, g: 176, b: 255 },
  { name: 'powder blue', r: 176, g: 224, b: 230 },
  { name: 'cream', r: 255, g: 253, b: 208 },
  { name: 'chocolate brown', r: 123, g: 63, b: 0 },
  { name: 'dusty rose', r: 220, g: 152, b: 152 },
  { name: 'sage green', r: 188, g: 184, b: 138 },
  { name: 'ivory', r: 255, g: 255, b: 240 },
  { name: 'camel', r: 193, g: 154, b: 107 },
  { name: 'burgundy', r: 128, g: 0, b: 32 },
  { name: 'navy', r: 0, g: 0, b: 128 },
  { name: 'black', r: 0, g: 0, b: 0 },
  { name: 'white', r: 255, g: 255, b: 255 },
  { name: 'grey', r: 128, g: 128, b: 128 },
  { name: 'red', r: 220, g: 20, b: 60 },
  { name: 'cobalt blue', r: 0, g: 71, b: 171 },
];

function colorDistance(r1: number, g1: number, b1: number, r2: number, g2: number, b2: number): number {
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
    : null;
}

function mapToVintageColor(hexColor: string): string {
  const rgb = hexToRgb(hexColor);
  if (!rgb) return 'neutral';

  let closestColor = VINTAGE_COLORS[0];
  let minDist = Infinity;

  for (const color of VINTAGE_COLORS) {
    const dist = colorDistance(rgb.r, rgb.g, rgb.b, color.r, color.g, color.b);
    if (dist < minDist) {
      minDist = dist;
      closestColor = color;
    }
  }
  return closestColor.name;
}

function extractStyleSignals(visionResponse: any) {
  const labels: string[] = (visionResponse.labelAnnotations ?? [])
    .filter((l: any) => l.score > 0.6)
    .map((l: any) => l.description.toLowerCase());

  const webLabels: string[] = (visionResponse.webDetection?.webEntities ?? [])
    .filter((e: any) => e.score > 0.5)
    .map((e: any) => e.description?.toLowerCase() ?? '');

  const allLabels = [...labels, ...webLabels];

  // Extract garment type
  let garment_type = 'clothing';
  for (const [key, value] of Object.entries(GARMENT_MAP)) {
    if (allLabels.some((l) => l.includes(key))) {
      garment_type = value;
      break;
    }
  }

  // Extract silhouette
  let silhouette = '';
  for (const [key, value] of Object.entries(SILHOUETTE_MAP)) {
    if (allLabels.some((l) => l.includes(key))) {
      silhouette = value;
      break;
    }
  }

  // Decade inference from style cues
  let decade_range = 'vintage';
  if (allLabels.some((l) => l.includes('mod') || l.includes('go-go') || l.includes('space age'))) {
    decade_range = '1960s';
  } else if (allLabels.some((l) => l.includes('disco') || l.includes('bohemian') || l.includes('bell bottom'))) {
    decade_range = '1970s';
  } else if (allLabels.some((l) => l.includes('power shoulder') || l.includes('neon') || l.includes('preppy'))) {
    decade_range = '1980s';
  } else if (allLabels.some((l) => l.includes('grunge') || l.includes('minimalist') || l.includes('slip dress'))) {
    decade_range = '1990s';
  }

  // Extract dominant colors
  const colorAnnotations = visionResponse.imagePropertiesAnnotation?.dominantColors?.colors ?? [];
  const dominant_colors = colorAnnotations
    .filter((c: any) => c.score > 0.1)
    .sort((a: any, b: any) => b.score - a.score)
    .slice(0, 3)
    .map((c: any) => {
      const r = Math.round(c.color.red ?? 0);
      const g = Math.round(c.color.green ?? 0);
      const b = Math.round(c.color.blue ?? 0);
      const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
      return mapToVintageColor(hex);
    })
    .filter((v: string, i: number, a: string[]) => a.indexOf(v) === i); // dedupe

  // Build search keywords
  const search_keywords = [
    'vintage',
    decade_range !== 'vintage' ? decade_range : '',
    garment_type,
    silhouette,
    ...dominant_colors.slice(0, 1),
  ].filter(Boolean);

  return {
    garment_type,
    decade_range,
    silhouette,
    dominant_colors,
    fabric_indicators: labels.filter((l) =>
      ['lace', 'denim', 'velvet', 'silk', 'wool', 'corduroy', 'leather', 'polyester', 'cotton'].includes(l)
    ),
    search_keywords,
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const { image_url } = await req.json();
    if (!image_url) {
      return new Response(JSON.stringify({ error: 'image_url is required' }), { status: 400 });
    }

    const GOOGLE_VISION_KEY = Deno.env.get('GOOGLE_VISION_API_KEY');
    if (!GOOGLE_VISION_KEY) {
      return new Response(JSON.stringify({ error: 'Vision API key not configured' }), { status: 500 });
    }

    // Call Google Vision API
    const visionRes = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_VISION_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [{
            image: { source: { imageUri: image_url } },
            features: [
              { type: 'LABEL_DETECTION', maxResults: 20 },
              { type: 'IMAGE_PROPERTIES' },
              { type: 'WEB_DETECTION', maxResults: 10 },
            ],
          }],
        }),
      }
    );

    if (!visionRes.ok) {
      const errText = await visionRes.text();
      return new Response(JSON.stringify({ error: `Vision API error: ${errText}` }), { status: 502 });
    }

    const visionData = await visionRes.json();
    const response = visionData.responses?.[0];

    if (!response) {
      return new Response(JSON.stringify({ error: 'No response from Vision API' }), { status: 502 });
    }

    const style_signals = extractStyleSignals(response);

    return new Response(JSON.stringify({ style_signals }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
