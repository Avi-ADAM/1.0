<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { Crosshair, Globe2, MapPin, MapPinned, RadioTower, RotateCcw } from '@lucide/svelte';
  import type { GeoJSONSource, Map as MapLibreMap, Marker, StyleSpecification } from 'maplibre-gl';
  import 'maplibre-gl/dist/maplibre-gl.css';

  export type LocationMode = 'online' | 'onsite' | 'hybrid' | 'unspecified';

  export type LocationValue = {
    location_mode: LocationMode;
    isOnline?: boolean;
    lat?: number | null;
    lng?: number | null;
    radius?: number | null;
    location_hint?: string | null;
  };

  type Props = {
    value?: LocationValue;
    label?: string;
    helper?: string;
    height?: string;
    disabled?: boolean;
    styleUrl?: string | StyleSpecification | null;
    onChange?: (value: LocationValue) => void;
  };

  const DEFAULT_CENTER = { lat: 31.7683, lng: 35.2137 };
  const DEFAULT_RADIUS_KM = 15;
  const CIRCLE_SOURCE_ID = 'location-radius';
  const CIRCLE_FILL_ID = 'location-radius-fill';
  const CIRCLE_LINE_ID = 'location-radius-line';

  const DEFAULT_STYLE: StyleSpecification = {
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
  };

  let {
    value = $bindable({
      location_mode: 'unspecified',
      isOnline: false,
      lat: null,
      lng: null,
      radius: DEFAULT_RADIUS_KM,
      location_hint: ''
    }),
    label = 'מיקום',
    helper = 'בחרו נקודה, טווח שירות, או סמנו שהכל קורה אונליין.',
    height = '360px',
    disabled = false,
    styleUrl = null,
    onChange
  }: Props = $props();

  let mapEl = $state<HTMLDivElement>();
  let map: MapLibreMap | null = null;
  let marker: Marker | null = null;
  let mapReady = $state(false);
  let loadingMap = $state(true);
  let locating = $state(false);
  let mapError = $state('');
  let geocoding = $state(false);

  // Tracks whether the user typed their own description. While false, picking a
  // point auto-fills location_hint with a reverse-geocoded place name.
  let hintEdited = $state(Boolean(value.location_hint?.trim()));
  let geocodeController: AbortController | null = null;
  let geocodeTimer: ReturnType<typeof setTimeout> | null = null;

  const hasPoint = $derived(
    typeof value.lat === 'number' &&
      Number.isFinite(value.lat) &&
      typeof value.lng === 'number' &&
      Number.isFinite(value.lng)
  );
  const radiusKm = $derived(
    typeof value.radius === 'number' && Number.isFinite(value.radius) && value.radius > 0
      ? value.radius
      : DEFAULT_RADIUS_KM
  );
  const locationSummary = $derived.by(() => {
    if (value.location_mode === 'online') return 'אונליין';
    if (!hasPoint) return value.location_hint || 'עדיין לא נבחרה נקודה';
    return `${value.lat?.toFixed(4)}, ${value.lng?.toFixed(4)} · ${radiusKm} ק״מ`;
  });

  onMount(async () => {
    try {
      const maplibregl = await import('maplibre-gl');
      await tick();

      if (!mapEl) return;

      const center: [number, number] = hasPoint
        ? [Number(value.lng), Number(value.lat)]
        : [DEFAULT_CENTER.lng, DEFAULT_CENTER.lat];

      map = new maplibregl.Map({
        container: mapEl,
        style: styleUrl || DEFAULT_STYLE,
        center,
        zoom: hasPoint ? 12 : 7,
        attributionControl: false
      });

      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-left');
      map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-left');

      marker = new maplibregl.Marker({
        color: '#ff4d9e',
        draggable: !disabled
      });

      marker.on('dragend', () => {
        const point = marker?.getLngLat();
        if (point) setPoint(point.lat, point.lng);
      });

      map.on('load', () => {
        mapReady = true;
        loadingMap = false;
        ensureRadiusLayers();
        updateMarkerAndRadius(false);
      });

      map.on('click', (event) => {
        if (disabled) return;
        setPoint(event.lngLat.lat, event.lngLat.lng);
      });
    } catch (error) {
      console.error('[LocationPicker] failed to initialize MapLibre', error);
      loadingMap = false;
      mapError = 'לא הצלחתי לטעון את המפה. עדיין אפשר למלא מיקום ידנית.';
    }

    return () => {
      if (geocodeTimer) clearTimeout(geocodeTimer);
      geocodeController?.abort();
      marker?.remove();
      map?.remove();
      marker = null;
      map = null;
    };
  });

  function updateValue(patch: Partial<LocationValue>) {
    const nextMode = patch.location_mode ?? value.location_mode ?? 'unspecified';
    const next: LocationValue = {
      ...value,
      ...patch,
      location_mode: nextMode,
      isOnline: nextMode === 'online'
    };

    value = next;
    onChange?.(next);
    updateMarkerAndRadius(true);
  }

  function setMode(mode: LocationMode) {
    updateValue({ location_mode: mode });
  }

  function setPoint(lat: number, lng: number) {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    const nextLat = roundCoord(lat);
    const nextLng = roundCoord(lng);
    const nextMode = value.location_mode === 'online' ? 'hybrid' : value.location_mode || 'onsite';
    updateValue({
      lat: nextLat,
      lng: nextLng,
      location_mode: nextMode === 'unspecified' ? 'onsite' : nextMode
    });
    scheduleAutoHint(nextLat, nextLng);
  }

  // Debounced reverse-geocode so dragging the marker / typing coords doesn't
  // hammer Nominatim (their policy asks for max ~1 req/sec).
  function scheduleAutoHint(lat: number, lng: number) {
    if (hintEdited) return;
    if (geocodeTimer) clearTimeout(geocodeTimer);
    geocoding = true;
    geocodeTimer = setTimeout(() => autoFillHint(lat, lng), 600);
  }

  async function autoFillHint(lat: number, lng: number) {
    if (hintEdited || typeof fetch === 'undefined') {
      geocoding = false;
      return;
    }
    geocodeController?.abort();
    const controller = new AbortController();
    geocodeController = controller;
    try {
      const url =
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=12&accept-language=he&lat=${lat}&lon=${lng}`;
      const res = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } });
      if (!res.ok) return;
      const data = await res.json();
      const label = formatPlace(data);
      // Re-check hintEdited: the user may have typed while we were fetching.
      if (label && !hintEdited) updateValue({ location_hint: label });
    } catch (error) {
      if ((error as Error)?.name !== 'AbortError') {
        console.warn('[LocationPicker] reverse geocode failed', error);
      }
    } finally {
      if (geocodeController === controller) {
        geocodeController = null;
        geocoding = false;
      }
    }
  }

  function formatPlace(data: any): string {
    const a = data?.address ?? {};
    const primary =
      a.city || a.town || a.village || a.municipality || a.suburb || a.neighbourhood || a.county;
    const secondary = a.state || a.country;
    if (primary && secondary && primary !== secondary) return `${primary}, ${secondary}`;
    if (primary) return primary;
    if (typeof data?.display_name === 'string') {
      return data.display_name.split(',').slice(0, 2).join(', ').trim();
    }
    return '';
  }

  function clearPoint() {
    updateValue({
      lat: null,
      lng: null,
      location_mode: value.location_mode === 'online' ? 'online' : 'unspecified'
    });
  }

  function updateRadius(nextRadius: number | undefined) {
    const radius = typeof nextRadius === 'number' && Number.isFinite(nextRadius) ? nextRadius : DEFAULT_RADIUS_KM;
    updateValue({ radius: Math.max(1, Math.min(250, Math.round(radius))) });
  }

  function updateHint(nextHint: string) {
    // Once the user types, stop auto-filling. If they clear it, allow auto again.
    hintEdited = Boolean(nextHint.trim());
    updateValue({ location_hint: nextHint });
  }

  function updateLat(lat: number | undefined) {
    if (typeof lat !== 'number' || !Number.isFinite(lat)) return;
    setPoint(lat, Number(value.lng ?? DEFAULT_CENTER.lng));
  }

  function updateLng(lng: number | undefined) {
    if (typeof lng !== 'number' || !Number.isFinite(lng)) return;
    setPoint(Number(value.lat ?? DEFAULT_CENTER.lat), lng);
  }

  async function useBrowserLocation() {
    if (disabled || typeof navigator === 'undefined' || !navigator.geolocation) {
      mapError = 'הדפדפן לא מאפשר קבלת מיקום כרגע.';
      return;
    }

    locating = true;
    mapError = '';
    navigator.geolocation.getCurrentPosition(
      (position) => {
        locating = false;
        setPoint(position.coords.latitude, position.coords.longitude);
      },
      (error) => {
        locating = false;
        mapError = error.message || 'לא הצלחנו לקבל מיקום מהדפדפן.';
      },
      { enableHighAccuracy: true, timeout: 9000, maximumAge: 60000 }
    );
  }

  function ensureRadiusLayers() {
    if (!map || map.getSource(CIRCLE_SOURCE_ID)) return;

    map.addSource(CIRCLE_SOURCE_ID, {
      type: 'geojson',
      data: emptyFeatureCollection()
    });

    map.addLayer({
      id: CIRCLE_FILL_ID,
      type: 'fill',
      source: CIRCLE_SOURCE_ID,
      paint: {
        'fill-color': '#02ffbb',
        'fill-opacity': 0.13
      }
    });

    map.addLayer({
      id: CIRCLE_LINE_ID,
      type: 'line',
      source: CIRCLE_SOURCE_ID,
      paint: {
        'line-color': '#02ffbb',
        'line-opacity': 0.72,
        'line-width': 2,
        'line-dasharray': [2, 2]
      }
    });
  }

  function updateMarkerAndRadius(fly: boolean) {
    if (!map || !marker || !mapReady) return;

    if (!hasPoint || value.location_mode === 'online') {
      marker.remove();
      setRadiusData(null);
      return;
    }

    const lngLat: [number, number] = [Number(value.lng), Number(value.lat)];
    marker.setLngLat(lngLat);
    if (!marker.getElement().parentElement) marker.addTo(map);
    setRadiusData(circleFeature(lngLat, radiusKm));

    if (fly) {
      map.easeTo({ center: lngLat, zoom: Math.max(map.getZoom(), 11), duration: 550 });
    }
  }

  function setRadiusData(feature: GeoJSON.Feature<GeoJSON.Polygon> | null) {
    const source = map?.getSource(CIRCLE_SOURCE_ID) as GeoJSONSource | undefined;
    source?.setData(feature ? { type: 'FeatureCollection', features: [feature] } : emptyFeatureCollection());
  }

  function circleFeature(center: [number, number], radius: number): GeoJSON.Feature<GeoJSON.Polygon> {
    const points: [number, number][] = [];
    const earthRadiusKm = 6371;
    const [lng, lat] = center;
    const latRad = toRad(lat);
    const lngRad = toRad(lng);
    const distance = radius / earthRadiusKm;

    for (let i = 0; i <= 96; i += 1) {
      const bearing = toRad((i / 96) * 360);
      const pointLat = Math.asin(
        Math.sin(latRad) * Math.cos(distance) +
          Math.cos(latRad) * Math.sin(distance) * Math.cos(bearing)
      );
      const pointLng =
        lngRad +
        Math.atan2(
          Math.sin(bearing) * Math.sin(distance) * Math.cos(latRad),
          Math.cos(distance) - Math.sin(latRad) * Math.sin(pointLat)
        );
      points.push([roundCoord(toDeg(pointLng)), roundCoord(toDeg(pointLat))]);
    }

    return {
      type: 'Feature',
      properties: {},
      geometry: { type: 'Polygon', coordinates: [points] }
    };
  }

  function emptyFeatureCollection(): GeoJSON.FeatureCollection<GeoJSON.Polygon> {
    return { type: 'FeatureCollection', features: [] };
  }

  function roundCoord(coord: number) {
    return Math.round(coord * 1_000_000) / 1_000_000;
  }

  function toRad(deg: number) {
    return (deg * Math.PI) / 180;
  }

  function toDeg(rad: number) {
    return (rad * 180) / Math.PI;
  }

  const modes: Array<{
    id: LocationMode;
    title: string;
    text: string;
    icon: typeof Globe2;
  }> = [
    { id: 'online', title: 'אונליין', text: 'אין תלות במיקום', icon: Globe2 },
    { id: 'onsite', title: 'פיזי', text: 'צריך להיות באזור', icon: MapPinned },
    { id: 'hybrid', title: 'היברידי', text: 'קרבה עוזרת', icon: RadioTower }
  ];
</script>

<section class="location-picker" aria-labelledby="location-picker-title">
  <div class="location-head">
    <div>
      <div class="eyebrow">Location scope</div>
      <h3 id="location-picker-title">{label}</h3>
      <p>{helper}</p>
    </div>
    <div class="summary-pill" title={locationSummary}>
      <MapPin size={15} />
      <span>{locationSummary}</span>
    </div>
  </div>

  <div class="mode-grid" role="group" aria-label="סוג המיקום">
    {#each modes as mode (mode.id)}
      <button
        type="button"
        class:active={value.location_mode === mode.id}
        class="mode-button"
        disabled={disabled}
        onclick={() => setMode(mode.id)}
      >
        <svelte:component this={mode.icon} size={17} />
        <span>
          <strong>{mode.title}</strong>
          <small>{mode.text}</small>
        </span>
      </button>
    {/each}
  </div>

  <div class:muted-map={value.location_mode === 'online'} class="map-shell">
    <div bind:this={mapEl} class="map-canvas" style:height></div>
    {#if loadingMap}
      <div class="map-state">טוען מפה...</div>
    {/if}
    {#if value.location_mode === 'online'}
      <div class="map-state map-state-soft">המיקום לא ישפיע על ההתאמה במצב אונליין.</div>
    {/if}
  </div>

  {#if mapError}
    <p class="map-error">{mapError}</p>
  {/if}

  <div class="control-grid">
    <label class="field field-wide">
      <span>תיאור מיקום{#if geocoding} · מאתר שם מקום…{/if}</span>
      <input
        disabled={disabled}
        placeholder="למשל: תל אביב והסביבה, חיפה, אונליין"
        value={value.location_hint ?? ''}
        oninput={(event) => updateHint(event.currentTarget.value)}
      />
    </label>

    <label class="field">
      <span>קו רוחב</span>
      <input
        disabled={disabled || value.location_mode === 'online'}
        type="number"
        step="0.000001"
        value={value.lat ?? ''}
        oninput={(event) => updateLat(event.currentTarget.valueAsNumber)}
      />
    </label>

    <label class="field">
      <span>קו אורך</span>
      <input
        disabled={disabled || value.location_mode === 'online'}
        type="number"
        step="0.000001"
        value={value.lng ?? ''}
        oninput={(event) => updateLng(event.currentTarget.valueAsNumber)}
      />
    </label>

    <label class="field radius-field">
      <span>טווח שירות · {radiusKm} ק״מ</span>
      <input
        disabled={disabled || value.location_mode === 'online'}
        type="range"
        min="1"
        max="120"
        step="1"
        value={radiusKm}
        oninput={(event) => updateRadius(event.currentTarget.valueAsNumber)}
      />
    </label>
  </div>

  <div class="actions-row">
    <button type="button" class="ghost-button" disabled={disabled || locating} onclick={useBrowserLocation}>
      <Crosshair size={16} />
      <span>{locating ? 'מאתר...' : 'המיקום שלי'}</span>
    </button>
    <button type="button" class="ghost-button" disabled={disabled || !hasPoint} onclick={clearPoint}>
      <RotateCcw size={16} />
      <span>ניקוי נקודה</span>
    </button>
  </div>
</section>

<style>
  .location-picker {
    border: 1px solid rgba(116, 191, 255, 0.22);
    border-radius: 18px;
    background:
      linear-gradient(180deg, rgba(116, 191, 255, 0.07), rgba(116, 191, 255, 0.01)),
      #0e0d0c;
    padding: 16px;
    box-shadow: 0 20px 55px rgba(0, 0, 0, 0.28);
  }

  .location-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 14px;
    margin-bottom: 14px;
  }

  .eyebrow {
    color: #74bfff;
    font-family: 'Cinzel', serif;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.22em;
    text-transform: uppercase;
  }

  h3 {
    color: #ede5d8;
    font-family: 'Sababa', 'Heebo', sans-serif;
    font-size: clamp(18px, 4vw, 22px);
    line-height: 1.15;
    margin: 3px 0 0;
  }

  p {
    color: #9a8f80;
    font-family: 'Bellefair', serif;
    font-size: 13px;
    line-height: 1.45;
    margin: 6px 0 0;
  }

  .summary-pill {
    align-items: center;
    background: rgba(2, 255, 187, 0.08);
    border: 1px solid rgba(2, 255, 187, 0.22);
    border-radius: 999px;
    color: #02ffbb;
    display: inline-flex;
    flex-shrink: 0;
    font-family: 'Bellefair', serif;
    font-size: 12px;
    gap: 6px;
    max-width: 240px;
    min-height: 32px;
    padding: 6px 11px;
  }

  .summary-pill span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .mode-grid {
    display: grid;
    gap: 8px;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    margin-bottom: 12px;
  }

  .mode-button {
    align-items: center;
    background: rgba(255, 255, 255, 0.025);
    border: 1px solid rgba(255, 255, 255, 0.075);
    border-radius: 12px;
    color: #9a8f80;
    cursor: pointer;
    display: flex;
    gap: 9px;
    min-width: 0;
    padding: 10px 11px;
    text-align: start;
    transition:
      border-color 0.2s,
      background 0.2s,
      color 0.2s,
      transform 0.2s;
  }

  .mode-button:hover:not(:disabled),
  .mode-button.active {
    background: rgba(116, 191, 255, 0.08);
    border-color: rgba(116, 191, 255, 0.42);
    color: #74bfff;
    transform: translateY(-1px);
  }

  .mode-button:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }

  .mode-button strong,
  .mode-button small {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .mode-button strong {
    color: #ede5d8;
    font-size: 13px;
    line-height: 1.2;
  }

  .mode-button small {
    color: currentColor;
    font-family: 'Bellefair', serif;
    font-size: 11px;
    line-height: 1.2;
    margin-top: 2px;
  }

  .map-shell {
    border: 1px solid rgba(238, 232, 170, 0.18);
    border-radius: 14px;
    overflow: hidden;
    position: relative;
  }

  .map-canvas {
    background:
      linear-gradient(135deg, rgba(116, 191, 255, 0.12), rgba(2, 255, 187, 0.06)),
      #171512;
    min-height: 260px;
    width: 100%;
  }

  .muted-map .map-canvas {
    filter: grayscale(0.9) brightness(0.55);
  }

  .map-state {
    align-items: center;
    background: rgba(7, 6, 6, 0.74);
    color: #ede5d8;
    display: flex;
    font-family: 'Bellefair', serif;
    font-size: 13px;
    inset: 0;
    justify-content: center;
    padding: 16px;
    position: absolute;
    text-align: center;
  }

  .map-state-soft {
    background: rgba(7, 6, 6, 0.5);
    color: #fde68a;
  }

  .map-error {
    background: rgba(255, 77, 158, 0.08);
    border: 1px solid rgba(255, 77, 158, 0.24);
    border-radius: 10px;
    color: #ff8cbe;
    padding: 8px 10px;
  }

  .control-grid {
    display: grid;
    gap: 10px;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    margin-top: 12px;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 5px;
    min-width: 0;
  }

  .field-wide,
  .radius-field {
    grid-column: 1 / -1;
  }

  .field span {
    color: #9a8f80;
    font-size: 11px;
    font-weight: 700;
  }

  .field input {
    background: rgba(255, 255, 255, 0.025);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 10px;
    box-sizing: border-box;
    color: #ede5d8;
    font-family: 'Bellefair', serif;
    font-size: 14px;
    min-height: 38px;
    outline: none;
    padding: 8px 10px;
    width: 100%;
  }

  .field input:focus {
    border-color: rgba(116, 191, 255, 0.44);
  }

  .field input:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }

  .field input[type='range'] {
    accent-color: #02ffbb;
    padding: 0;
  }

  .actions-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 12px;
  }

  .ghost-button {
    align-items: center;
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.11);
    border-radius: 11px;
    color: #c8bba8;
    cursor: pointer;
    display: inline-flex;
    font-size: 13px;
    gap: 7px;
    min-height: 36px;
    padding: 8px 12px;
    transition:
      background 0.2s,
      border-color 0.2s,
      color 0.2s;
  }

  .ghost-button:hover:not(:disabled) {
    background: rgba(238, 232, 170, 0.05);
    border-color: rgba(238, 232, 170, 0.3);
    color: #fde68a;
  }

  .ghost-button:disabled {
    cursor: not-allowed;
    opacity: 0.48;
  }

  :global(.maplibregl-ctrl-group) {
    background: rgba(14, 13, 12, 0.88);
    border: 1px solid rgba(255, 255, 255, 0.12);
    box-shadow: none;
  }

  :global(.maplibregl-ctrl-group button + button) {
    border-top-color: rgba(255, 255, 255, 0.1);
  }

  :global(.maplibregl-ctrl-attrib) {
    background: rgba(14, 13, 12, 0.72);
    color: #9a8f80;
  }

  @media (max-width: 680px) {
    .location-head {
      flex-direction: column;
    }

    .summary-pill {
      max-width: 100%;
      width: 100%;
    }

    .mode-grid,
    .control-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
