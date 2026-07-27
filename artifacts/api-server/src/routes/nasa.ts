/**
 * NASA API プロキシルート
 * APOD (Astronomy Picture of the Day) と Image & Video Library の
 * プロキシエンドポイントを提供する。
 * ブラウザから直接呼ぶと CORS 制限が出る場合のフォールバックとして使用。
 */
import { Router } from 'express';

const router = Router();

// ── APOD (Astronomy Picture of the Day) ──────────────────────────────────────
router.get('/apod', async (_req, res) => {
  try {
    const response = await fetch(
      'https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY',
      { signal: AbortSignal.timeout(10_000) },
    );
    if (!response.ok) {
      return res.status(response.status).json({ error: 'NASA APOD API error', status: response.status });
    }
    const data = await response.json();
    // Cache for 12 hours
    res.set('Cache-Control', 'public, max-age=43200');
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch APOD', detail: String(err) });
  }
});

// ── NASA Image & Video Library search ────────────────────────────────────────
router.get('/image-search', async (req, res) => {
  const { q, page_size = '5' } = req.query;
  if (!q || typeof q !== 'string') {
    return res.status(400).json({ error: 'Missing required query parameter: q' });
  }
  try {
    const url =
      `https://images-api.nasa.gov/search` +
      `?q=${encodeURIComponent(q)}&media_type=image&page_size=${encodeURIComponent(String(page_size))}`;
    const response = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (!response.ok) {
      return res.status(response.status).json({ error: 'NASA Image API error', status: response.status });
    }
    const data = await response.json();
    // Cache for 1 hour
    res.set('Cache-Control', 'public, max-age=3600');
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch NASA image', detail: String(err) });
  }
});

// ── ISS / satellite orbital data (simplified static TLE-derived info) ─────────
router.get('/satellite/:id', (req, res) => {
  const { id } = req.params;
  const data: Record<string, object> = {
    iss: {
      nameEn: 'International Space Station',
      noradId: 25544,
      altitudeKm: 408,
      inclinationDeg: 51.6,
      periodMin: 92.68,
      speedKms: 7.66,
      orbitType: 'LEO',
      lastUpdated: new Date().toISOString(),
    },
    hubble: {
      nameEn: 'Hubble Space Telescope',
      noradId: 20580,
      altitudeKm: 547,
      inclinationDeg: 28.5,
      periodMin: 95.42,
      speedKms: 7.59,
      orbitType: 'LEO',
      lastUpdated: new Date().toISOString(),
    },
  };
  const info = data[id.toLowerCase()];
  if (!info) return res.status(404).json({ error: `Unknown satellite: ${id}` });
  res.set('Cache-Control', 'public, max-age=300');
  return res.json(info);
});

export default router;
