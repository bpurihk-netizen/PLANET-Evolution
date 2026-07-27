/**
 * NASA Image and Video Library API + APOD utilities
 * No API key required for Image Library.
 * APOD uses the public DEMO_KEY (rate-limited but sufficient for demos).
 */

export interface NasaImage {
  nasaId: string;
  title: string;
  thumbUrl: string;
}

// ── In-memory cache ──────────────────────────────────────────────────────────
const imgCache = new Map<string, NasaImage | null>();
const inFlight = new Map<string, Promise<NasaImage | null>>();

/**
 * Search NASA Image & Video Library for one image matching `query`.
 * Returns the first result's thumbnail URL, or null on failure / no result.
 */
export async function fetchNasaImage(query: string): Promise<NasaImage | null> {
  if (imgCache.has(query)) return imgCache.get(query) ?? null;
  if (inFlight.has(query)) return inFlight.get(query)!;

  const promise = (async (): Promise<NasaImage | null> => {
    try {
      const url =
        `https://images-api.nasa.gov/search` +
        `?q=${encodeURIComponent(query)}&media_type=image&page_size=5`;
      const res = await fetch(url, { signal: AbortSignal.timeout(9000) });
      if (!res.ok) return null;

      const data = await res.json();
      const items: any[] = data?.collection?.items ?? [];

      for (const item of items) {
        const links: any[] = item.links ?? [];
        const thumb = links.find(
          (l) => l.rel === 'preview' && l.render === 'image',
        );
        if (thumb?.href) {
          const result: NasaImage = {
            nasaId: item.data?.[0]?.nasa_id ?? '',
            title: item.data?.[0]?.title ?? query,
            thumbUrl: thumb.href,
          };
          imgCache.set(query, result);
          return result;
        }
      }
      imgCache.set(query, null);
      return null;
    } catch {
      imgCache.set(query, null);
      return null;
    } finally {
      inFlight.delete(query);
    }
  })();

  inFlight.set(query, promise);
  return promise;
}

// ── APOD ─────────────────────────────────────────────────────────────────────
export interface ApodImage {
  title: string;
  url: string;
  explanation: string;
}

let apodResult: ApodImage | null | undefined = undefined; // undefined = not yet fetched

export async function fetchApod(): Promise<ApodImage | null> {
  if (apodResult !== undefined) return apodResult;
  try {
    const res = await fetch(
      'https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY',
      { signal: AbortSignal.timeout(9000) },
    );
    if (!res.ok) { apodResult = null; return null; }
    const data = await res.json();
    if (data.media_type === 'image') {
      apodResult = { title: data.title, url: data.url, explanation: data.explanation };
      return apodResult;
    }
    apodResult = null;
    return null;
  } catch {
    apodResult = null;
    return null;
  }
}

// ── Per-object NASA search queries ───────────────────────────────────────────
export const NASA_OBJECT_QUERIES: Record<string, string> = {
  // LSS features
  'laniakea':        'Laniakea supercluster galaxies map',
  'perseus-pisces':  'Perseus cluster galaxy Abell 426 X-ray',
  'coma':            'Coma galaxy cluster Abell 1656 Hubble',
  'shapley':         'Shapley supercluster Abell 3558 galaxies',
  'bootes-void':     'cosmic void large scale structure universe',
  'sloan-great-wall':'cosmic web galaxy filament large scale structure',
  'hercules-corona': 'galaxy cluster deep field Hubble',

  // Galaxy clusters
  'local-group-area':  'Local Group Milky Way Andromeda Hubble',
  'virgo-cluster':     'Virgo galaxy cluster M87 Hubble',
  'fornax-cluster':    'Fornax cluster NGC 1399 Hubble',
  'hydra-centaurus':   'Centaurus A NGC 5128 Hubble',
  'antlia-cluster':    'Antlia galaxy cluster',
  'perseus-cluster':   'Perseus cluster Abell 426 X-ray Chandra',
  'pisces-cluster':    'Perseus Pisces galaxy supercluster filament',
  'coma-cluster':      'Coma galaxy cluster Hubble',
  'leo-cluster':       'Leo Abell 1367 galaxy cluster Hubble',
  'a3558':             'Abell 3558 Shapley galaxy cluster',
  'a3571':             'Abell 3571 galaxy cluster X-ray',

  // Galaxy groups
  'local-group':    'Local Group Andromeda Milky Way galaxies',
  'sculptor-group': 'NGC 253 sculptor galaxy Hubble',
  'ic342-group':    'IC 342 hidden galaxy infrared',
  'virgo-a-group':  'M87 galaxy black hole jet Hubble',
  'virgo-b-group':  'M49 elliptical galaxy Virgo',
  'm81-group':      'M81 M82 galaxy pair Hubble',
  'fornax-group':   'NGC 1399 Fornax elliptical galaxy Hubble',
  'cen-a-group':    'Centaurus A NGC 5128 M83 galaxies',
  'antlia-group':   'Antlia dwarf galaxies',
  'perseus-group':  'Perseus galaxy cluster members Hubble',
  'coma-group':     'Coma cluster galaxy members Hubble',

  // Galaxies
  'milky-way':         'Milky Way galaxy center infrared Hubble',
  'andromeda':         'Andromeda galaxy M31 Hubble',
  'triangulum':        'Triangulum M33 galaxy Hubble',
  'lmc':               'Large Magellanic Cloud Hubble',
  'smc':               'Small Magellanic Cloud Hubble',
  'sagittarius-dwarf': 'Sagittarius dwarf galaxy tidal stream',
  'ic1613':            'IC 1613 irregular galaxy Hubble',
  'm87':               'M87 galaxy black hole jet Hubble',
  'm84':               'M84 galaxy Virgo Hubble',
  'm86':               'M86 galaxy Virgo cluster',
  'm49':               'M49 elliptical galaxy Virgo Hubble',
  'm58':               'M58 barred spiral galaxy Hubble',
  'm81':               'M81 Bode galaxy spiral Hubble',
  'm82':               'M82 cigar starburst galaxy Hubble',
  'ngc253':            'NGC 253 sculptor galaxy starburst Hubble',
  'ngc55':             'NGC 55 irregular galaxy southern',
  'ic342':             'IC 342 spiral galaxy infrared Hubble',
  'maffei1':           'Maffei 1 infrared galaxy',
  'ngc1399':           'NGC 1399 Fornax elliptical galaxy Hubble',
  'ngc1316':           'NGC 1316 Fornax A lenticular galaxy Hubble',
  'cen-a':             'Centaurus A NGC 5128 radio jets Hubble',
  'm83':               'M83 Southern Pinwheel galaxy Hubble',

  // Star systems (used at galaxy level)
  'solar-system':   'solar system planets NASA',
  'alpha-centauri': 'Alpha Centauri star system',
  'trappist1':      'TRAPPIST-1 exoplanet system',
  'kepler442':      'Kepler 442 habitable exoplanet',
};

// ── Background queries for each cosmic level ─────────────────────────────────
export const NASA_LEVEL_BG_QUERIES: Record<string, string> = {
  lss:         'cosmic web large scale structure universe filament',
  supercluster:'galaxy supercluster deep field Hubble',
  cluster:     'galaxy cluster Hubble deep field',
  group:       'galaxy group Local Group Andromeda',
  galaxy:      'spiral galaxy Hubble barred',
};
