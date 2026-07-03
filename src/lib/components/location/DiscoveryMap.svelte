<script lang="ts">
  import { onMount, tick } from 'svelte';
  import type {
    GeoJSONSource,
    Map as MapLibreMap,
    MapLayerMouseEvent,
    StyleSpecification
  } from 'maplibre-gl';
  import 'maplibre-gl/dist/maplibre-gl.css';
  import type { MapItem, MapLayer } from '$lib/map/discoveryTypes';

  type Props = {
    /** All layers, mounted once; toggle display via `visibleLayerIds`. */
    layers: MapLayer[];
    visibleLayerIds: string[];
    height?: string;
    /** [lng, lat] — when omitted, fits to the data. */
    center?: [number, number] | null;
    zoom?: number | null;
    styleUrl?: string | StyleSpecification | null;
    onSelect?: (item: MapItem | null) => void;
    onViewChange?: (view: {
      center: [number, number];
      zoom: number;
      visibleIds: string[];
    }) => void;
  };

  const DEFAULT_CENTER: [number, number] = [35.2137, 31.7683];

  // Same OSM raster base as LocationPicker, plus glyphs so cluster counts
  // (symbol layers) can render text.
  const DEFAULT_STYLE: StyleSpecification = {
    version: 8,
    glyphs: 'https://fonts.openmaptiles.org/{fontstack}/{range}.pbf',
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
    layers,
    visibleLayerIds,
    height = '480px',
    center = null,
    zoom = null,
    styleUrl = null,
    onSelect,
    onViewChange
  }: Props = $props();

  let mapEl = $state<HTMLDivElement>();
  let map: MapLibreMap | null = null;
  let mapReady = $state(false);
  let loadingMap = $state(true);
  let mapError = $state(false);

  const visibleSet = $derived(new Set(visibleLayerIds));

  function itemKey(layerId: string, itemId: string) {
    return `${layerId}:${itemId}`;
  }

  const itemIndex = $derived.by(() => {
    const index = new Map<string, MapItem>();
    for (const layer of layers) {
      for (const item of layer.items) {
        index.set(itemKey(layer.id, item.id), item);
      }
    }
    return index;
  });

  function toFeatureCollection(layer: MapLayer): GeoJSON.FeatureCollection {
    return {
      type: 'FeatureCollection',
      features: layer.items
        .filter((item) => item.lat !== null && item.lng !== null)
        .map((item) => ({
          type: 'Feature' as const,
          geometry: {
            type: 'Point' as const,
            coordinates: [item.lng as number, item.lat as number]
          },
          properties: { key: itemKey(layer.id, item.id) }
        }))
    };
  }

  function dataBounds(): [[number, number], [number, number]] | null {
    let minLng = Infinity,
      minLat = Infinity,
      maxLng = -Infinity,
      maxLat = -Infinity,
      found = false;
    for (const layer of layers) {
      for (const item of layer.items) {
        if (item.lat === null || item.lng === null) continue;
        found = true;
        minLng = Math.min(minLng, item.lng);
        maxLng = Math.max(maxLng, item.lng);
        minLat = Math.min(minLat, item.lat);
        maxLat = Math.max(maxLat, item.lat);
      }
    }
    return found
      ? [
          [minLng, minLat],
          [maxLng, maxLat]
        ]
      : null;
  }

  function reportView() {
    if (!map) return;
    const bounds = map.getBounds();
    const visibleIds: string[] = [];
    for (const layer of layers) {
      if (!visibleSet.has(layer.id)) continue;
      for (const item of layer.items) {
        if (item.lat === null || item.lng === null) {
          visibleIds.push(itemKey(layer.id, item.id));
          continue;
        }
        if (bounds.contains([item.lng, item.lat])) {
          visibleIds.push(itemKey(layer.id, item.id));
        }
      }
    }
    const c = map.getCenter();
    onViewChange?.({ center: [c.lng, c.lat], zoom: map.getZoom(), visibleIds });
  }

  function addLayer(layer: MapLayer) {
    if (!map) return;
    const srcId = `src-${layer.id}`;
    map.addSource(srcId, {
      type: 'geojson',
      data: toFeatureCollection(layer),
      cluster: true,
      clusterRadius: 45,
      clusterMaxZoom: 13
    });
    const visibility = visibleSet.has(layer.id) ? 'visible' : 'none';
    map.addLayer({
      id: `${layer.id}-clusters`,
      type: 'circle',
      source: srcId,
      filter: ['has', 'point_count'],
      layout: { visibility },
      paint: {
        'circle-color': layer.color,
        'circle-opacity': 0.75,
        'circle-radius': ['step', ['get', 'point_count'], 16, 10, 22, 50, 28],
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff'
      }
    });
    map.addLayer({
      id: `${layer.id}-cluster-count`,
      type: 'symbol',
      source: srcId,
      filter: ['has', 'point_count'],
      layout: {
        visibility,
        'text-field': '{point_count_abbreviated}',
        'text-font': ['Noto Sans Regular'],
        'text-size': 12
      },
      paint: { 'text-color': '#ffffff' }
    });
    map.addLayer({
      id: `${layer.id}-points`,
      type: 'circle',
      source: srcId,
      filter: ['!', ['has', 'point_count']],
      layout: { visibility },
      paint: {
        'circle-color': layer.color,
        'circle-radius': 8,
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff'
      }
    });

    map.on('click', `${layer.id}-points`, (event: MapLayerMouseEvent) => {
      const key = event.features?.[0]?.properties?.key;
      if (typeof key === 'string') {
        onSelect?.(itemIndex.get(key) ?? null);
      }
    });
    map.on('click', `${layer.id}-clusters`, async (event: MapLayerMouseEvent) => {
      const feature = event.features?.[0];
      if (!feature || !map) return;
      const source = map.getSource(srcId) as GeoJSONSource;
      const zoomTo = await source.getClusterExpansionZoom(
        feature.properties?.cluster_id
      );
      map.easeTo({
        center: (feature.geometry as GeoJSON.Point).coordinates as [number, number],
        zoom: zoomTo
      });
    });
    for (const sub of ['points', 'clusters']) {
      map.on('mouseenter', `${layer.id}-${sub}`, () => {
        if (map) map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', `${layer.id}-${sub}`, () => {
        if (map) map.getCanvas().style.cursor = '';
      });
    }
  }

  onMount(() => {
    let disposed = false;
    init();
    return () => {
      disposed = true;
      map?.remove();
      map = null;
    };

    async function init() {
      try {
        const maplibregl = await import('maplibre-gl');
        await tick();
        if (!mapEl || disposed) return;

        map = new maplibregl.Map({
          container: mapEl,
          style: styleUrl || DEFAULT_STYLE,
          center: center ?? DEFAULT_CENTER,
          zoom: zoom ?? 7,
          attributionControl: false
        });
        map.addControl(
          new maplibregl.NavigationControl({ showCompass: false }),
          'top-left'
        );
        map.addControl(
          new maplibregl.AttributionControl({ compact: true }),
          'bottom-left'
        );
  
        map.on('load', () => {
          for (const layer of layers) addLayer(layer);
          if (!center) {
            const bounds = dataBounds();
            if (bounds) {
              map?.fitBounds(bounds, { padding: 48, maxZoom: 12, animate: false });
            }
          }
          mapReady = true;
          loadingMap = false;
          reportView();
        });
        map.on('moveend', reportView);
        map.on('click', (event) => {
          // Clicks that hit no point layer clear the selection.
          const hits = map?.queryRenderedFeatures(event.point, {
            layers: layers
              .flatMap((l) => [`${l.id}-points`, `${l.id}-clusters`])
              .filter((id) => !!map?.getLayer(id))
          });
          if (!hits?.length) onSelect?.(null);
        });
      } catch (error) {
        console.error('[DiscoveryMap] failed to initialize MapLibre', error);
        loadingMap = false;
        mapError = true;
      }
    }
  });

  // Data refresh (e.g. lens change re-runs the load) — push into the sources.
  $effect(() => {
    if (!map || !mapReady) return;
    for (const layer of layers) {
      const source = map.getSource(`src-${layer.id}`) as GeoJSONSource | undefined;
      source?.setData(toFeatureCollection(layer));
    }
  });

  // Layer-toggle visibility.
  $effect(() => {
    if (!map || !mapReady) return;
    for (const layer of layers) {
      const visibility = visibleSet.has(layer.id) ? 'visible' : 'none';
      for (const sub of ['clusters', 'cluster-count', 'points']) {
        const layerId = `${layer.id}-${sub}`;
        if (map.getLayer(layerId)) {
          map.setLayoutProperty(layerId, 'visibility', visibility);
        }
      }
    }
    reportView();
  });

  export function flyTo(item: MapItem) {
    if (!map || item.lat === null || item.lng === null) return;
    map.flyTo({ center: [item.lng, item.lat], zoom: Math.max(map.getZoom(), 12) });
  }
</script>

<div class="discovery-map" style:height>
  <div class="map-canvas" bind:this={mapEl}></div>
  {#if loadingMap}
    <div class="map-overlay" aria-hidden="true">
      <span class="pulse"></span>
    </div>
  {/if}
  {#if mapError}
    <div class="map-overlay error">🗺️</div>
  {/if}
</div>

<style>
  .discovery-map {
    position: relative;
    width: 100%;
    border-radius: 1rem;
    overflow: hidden;
  }
  .map-canvas {
    position: absolute;
    inset: 0;
  }
  .map-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.55);
    pointer-events: none;
  }
  .map-overlay.error {
    font-size: 2rem;
  }
  .pulse {
    width: 2.25rem;
    height: 2.25rem;
    border-radius: 9999px;
    border: 3px solid rgba(120, 120, 160, 0.35);
    border-top-color: rgba(120, 120, 160, 0.9);
    animation: spin 0.9s linear infinite;
  }
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
