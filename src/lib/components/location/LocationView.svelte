<script>
  import { isRtl } from '$lib/translations';
  import { onDestroy, tick } from 'svelte';
  import { lang } from '$lib/stores/lang.js';
  import { Globe2, MapPin, MapPinned, RadioTower, ChevronDown } from '@lucide/svelte';
  import 'maplibre-gl/dist/maplibre-gl.css';

  /**
   * @typedef {Object} LocationValue
   * @property {string} [location_mode]
   * @property {number|null} [lat]
   * @property {number|null} [lng]
   * @property {number|null} [radius]
   * @property {string|null} [location_hint]
   */

  /**
   * @typedef {Object} Props
   * @property {LocationValue|null} [location]
   * @property {boolean} [showMap] - render an expandable read-only map
   * @property {string} [mapHeight]
   * @property {boolean} [dense] - tighter padding (for card faces)
   * @property {boolean} [hideWhenEmpty] - render nothing when no location set
   */

  /** @type {Props} */
  let {
    location = null,
    showMap = false,
    mapHeight = '180px',
    dense = false,
    hideWhenEmpty = true
  } = $props();

  const DEFAULT_RADIUS_KM = 15;

  const T = {
    online: { he: 'אונליין', en: 'Online' },
    onsite: { he: 'פיזי', en: 'On-site' },
    hybrid: { he: 'היברידי', en: 'Hybrid' },
    empty: { he: 'מיקום לא צוין', en: 'No location set' },
    range: { he: 'טווח', en: 'range' },
    km: { he: 'ק״מ', en: 'km' },
    showMap: { he: 'הצג מפה', en: 'Show map' },
    hideMap: { he: 'הסתר מפה', en: 'Hide map' }
  };

  const hasPoint = $derived(
    typeof location?.lat === 'number' &&
      Number.isFinite(location.lat) &&
      typeof location?.lng === 'number' &&
      Number.isFinite(location.lng)
  );

  const mode = $derived(location?.location_mode ?? 'unspecified');
  const isOnline = $derived(mode === 'online');

  const radiusKm = $derived(
    typeof location?.radius === 'number' && Number.isFinite(location.radius) && location.radius > 0
      ? location.radius
      : DEFAULT_RADIUS_KM
  );

  const hint = $derived(location?.location_hint?.trim() || '');

  const isEmpty = $derived(!location || (!isOnline && !hasPoint && !hint));

  const ModeIcon = $derived(
    isOnline ? Globe2 : mode === 'hybrid' ? RadioTower : hasPoint ? MapPinned : MapPin
  );
  const modeLabel = $derived(
    isOnline ? T.online[$lang] : mode === 'hybrid' ? T.hybrid[$lang] : T.onsite[$lang]
  );

  // ── lazy read-only map ─────────────────────────────────────────────────────
  let expanded = $state(false);
  let mapEl = $state();
  let map = null;
  let mapLoaded = $state(false);

  async function ensureMap() {
    if (map || !hasPoint) return;
    await tick();
    if (!mapEl) return;
    try {
      const maplibregl = await import('maplibre-gl');
      const center = [Number(location.lng), Number(location.lat)];
      map = new maplibregl.Map({
        container: mapEl,
        style: {
          version: 8,
          sources: {
            osm: {
              type: 'raster',
              tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
              tileSize: 256,
              attribution: 'OpenStreetMap contributors'
            }
          },
          layers: [{ id: 'osm', type: 'raster', source: 'osm' }]
        },
        center,
        zoom: 11,
        interactive: true,
        attributionControl: false
      });
      map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-left');
      new maplibregl.Marker({ color: '#ff4d9e' }).setLngLat(center).addTo(map);
      map.on('load', () => {
        mapLoaded = true;
        map.addSource('radius', { type: 'geojson', data: circleFeature(center, radiusKm) });
        map.addLayer({
          id: 'radius-fill',
          type: 'fill',
          source: 'radius',
          paint: { 'fill-color': '#02ffbb', 'fill-opacity': 0.12 }
        });
        map.addLayer({
          id: 'radius-line',
          type: 'line',
          source: 'radius',
          paint: { 'line-color': '#02ffbb', 'line-opacity': 0.7, 'line-width': 2, 'line-dasharray': [2, 2] }
        });
        map.fitBounds(circleBounds(center, radiusKm), { padding: 24, duration: 0, maxZoom: 13 });
      });
    } catch (e) {
      console.error('[LocationView] map failed to load', e);
    }
  }

  function toggleMap() {
    expanded = !expanded;
    if (expanded) ensureMap();
  }

  onDestroy(() => {
    map?.remove();
    map = null;
  });

  function toRad(d) {
    return (d * Math.PI) / 180;
  }
  function toDeg(r) {
    return (r * 180) / Math.PI;
  }
  function circleFeature(center, radius) {
    const pts = [];
    const earth = 6371;
    const [lng, lat] = center;
    const latR = toRad(lat);
    const lngR = toRad(lng);
    const dist = radius / earth;
    for (let i = 0; i <= 64; i += 1) {
      const b = toRad((i / 64) * 360);
      const pLat = Math.asin(Math.sin(latR) * Math.cos(dist) + Math.cos(latR) * Math.sin(dist) * Math.cos(b));
      const pLng =
        lngR +
        Math.atan2(
          Math.sin(b) * Math.sin(dist) * Math.cos(latR),
          Math.cos(dist) - Math.sin(latR) * Math.sin(pLat)
        );
      pts.push([toDeg(pLng), toDeg(pLat)]);
    }
    return { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [pts] } };
  }
  function circleBounds(center, radius) {
    const [lng, lat] = center;
    const dLat = radius / 111;
    const dLng = radius / (111 * Math.cos(toRad(lat)) || 1);
    return [
      [lng - dLng, lat - dLat],
      [lng + dLng, lat + dLat]
    ];
  }
</script>

{#if !(isEmpty && hideWhenEmpty)}
  <div class="loc-view" class:dense dir={$isRtl ? 'rtl' : 'ltr'}>
    <div class="loc-row">
      <span class="loc-badge" class:online={isOnline}>
        <ModeIcon size={dense ? 13 : 15} />
        <span>{modeLabel}</span>
      </span>

      {#if isEmpty}
        <span class="loc-muted">{T.empty[$lang]}</span>
      {:else}
        {#if hint}
          <span class="loc-hint" title={hint}>{hint}</span>
        {/if}
        {#if !isOnline && hasPoint}
          <span class="loc-radius">{T.range[$lang]} · {radiusKm} {T.km[$lang]}</span>
        {/if}
      {/if}

      {#if showMap && hasPoint && !isOnline}
        <button type="button" class="loc-mapbtn" onclick={toggleMap} aria-expanded={expanded}>
          <span>{expanded ? T.hideMap[$lang] : T.showMap[$lang]}</span>
          <span class="loc-chev" class:open={expanded}><ChevronDown size={14} /></span>
        </button>
      {/if}
    </div>

    {#if showMap && hasPoint && !isOnline && expanded}
      <div class="loc-map" style:height={mapHeight}>
        <div bind:this={mapEl} class="loc-map-canvas"></div>
        {#if !mapLoaded}
          <div class="loc-map-state">{$lang === 'he' ? 'טוען מפה…' : 'Loading map…'}</div>
        {/if}
      </div>
    {/if}
  </div>
{/if}

<style>
  .loc-view {
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 100%;
    box-sizing: border-box;
  }

  .loc-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    min-width: 0;
  }

  .loc-badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    flex-shrink: 0;
    padding: 3px 9px;
    border-radius: 999px;
    border: 1px solid color-mix(in srgb, var(--gold, #b38728) 45%, transparent);
    background: color-mix(in srgb, var(--gold, #b38728) 12%, transparent);
    color: var(--gold, #b38728);
    font-size: 12px;
    font-weight: 700;
    line-height: 1;
  }

  .loc-badge.online {
    border-color: rgba(116, 191, 255, 0.5);
    background: rgba(116, 191, 255, 0.12);
    color: #4aa3ff;
  }

  .loc-hint {
    flex: 1 1 auto;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--barbi, #c20071);
    font-size: 13px;
    font-weight: 600;
  }

  .loc-radius {
    flex-shrink: 0;
    color: #0aa37e;
    font-size: 11.5px;
    font-weight: 700;
    white-space: nowrap;
  }

  .loc-muted {
    color: var(--mturk, #9a8f80);
    font-size: 12.5px;
    font-style: italic;
  }

  .loc-mapbtn {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    flex-shrink: 0;
    margin-inline-start: auto;
    padding: 2px 6px;
    border-radius: 8px;
    border: 1px solid color-mix(in srgb, var(--mturk, #9a8f80) 35%, transparent);
    background: transparent;
    color: var(--mturk, #9a8f80);
    font-size: 11px;
    cursor: pointer;
    transition: color 0.15s, border-color 0.15s;
  }

  .loc-mapbtn:hover {
    color: var(--gold, #b38728);
    border-color: color-mix(in srgb, var(--gold, #b38728) 45%, transparent);
  }

  .loc-chev {
    display: inline-flex;
    transition: transform 0.2s ease;
  }
  .loc-chev.open {
    transform: rotate(180deg);
  }

  .loc-map {
    position: relative;
    width: 100%;
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid color-mix(in srgb, var(--gold, #b38728) 25%, transparent);
  }

  .loc-map-canvas {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }

  .loc-map-state {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.35);
    color: #fff;
    font-size: 13px;
  }

  .dense .loc-badge {
    padding: 2px 7px;
    font-size: 11px;
  }
  .dense .loc-hint {
    font-size: 12px;
  }

  @media (max-width: 480px) {
    .loc-hint {
      flex-basis: 100%;
    }
  }
</style>
