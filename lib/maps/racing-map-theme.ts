import type maplibregl from "maplibre-gl"

/** OpenFreeMap dark basemap — tuned at runtime for a racing-HUD look */
export const RACING_MAP_STYLE =
  "https://tiles.openfreemap.org/styles/dark"

export const RACING_MAP_POPUP_CLASS = "racing-map-popup"

const LABEL_LAYERS_TO_HIDE = [
  "highway_name_other",
  "highway_name_motorway",
  "water_name",
  "place_other",
  "place_suburb",
  "place_village",
] as const

function setPaint(
  map: maplibregl.Map,
  layer: string,
  property: string,
  value: unknown
) {
  if (!map.getLayer(layer)) return
  map.setPaintProperty(layer, property, value)
}

function hideLayer(map: maplibregl.Map, layer: string) {
  if (!map.getLayer(layer)) return
  map.setLayoutProperty(layer, "visibility", "none")
}

/** Push the dark basemap toward a night-racing / minimap aesthetic */
export function applyRacingMapTheme(map: maplibregl.Map) {
  setPaint(map, "background", "background-color", "#06060c")
  setPaint(map, "water", "fill-color", "#0a1628")

  setPaint(map, "highway_motorway_inner", "line-color", "#fde047")
  setPaint(map, "highway_motorway_casing", "line-color", "#1d4ed8")
  setPaint(map, "highway_motorway_subtle", "line-color", "#854d0e")

  setPaint(map, "highway_major_inner", "line-color", "#e2e8f0")
  setPaint(map, "highway_major_casing", "line-color", "#334155")
  setPaint(map, "highway_major_subtle", "line-color", "#475569")

  setPaint(map, "highway_minor", "line-color", "#64748b")
  setPaint(map, "highway_path", "line-color", "#475569")

  setPaint(map, "place_city", "text-color", "#94a3b8")
  setPaint(map, "place_city_large", "text-color", "#cbd5e1")
  setPaint(map, "place_town", "text-color", "#64748b")

  for (const layer of LABEL_LAYERS_TO_HIDE) {
    hideLayer(map, layer)
  }
}
