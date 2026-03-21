export const PINNED_SENSOR_IDS_STORAGE_KEY = "pinned_sensor_ids";
export const PINNED_SENSOR_IDS_UPDATED_EVENT = "pinned-sensor-ids-updated";

function normalizeSensorIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const normalized = value
    .map((item) => String(item ?? "").trim())
    .filter(Boolean);
  return Array.from(new Set(normalized));
}

export function readPinnedSensorIds(): string[] {
  if (!import.meta.client) return [];
  try {
    const raw = window.localStorage.getItem(PINNED_SENSOR_IDS_STORAGE_KEY);
    if (!raw) return [];
    return normalizeSensorIds(JSON.parse(raw));
  } catch {
    return [];
  }
}

export function writePinnedSensorIds(sensorIds: string[]): string[] {
  const normalized = normalizeSensorIds(sensorIds);
  if (!import.meta.client) return normalized;

  window.localStorage.setItem(
    PINNED_SENSOR_IDS_STORAGE_KEY,
    JSON.stringify(normalized),
  );
  window.dispatchEvent(
    new CustomEvent(PINNED_SENSOR_IDS_UPDATED_EVENT, {
      detail: normalized,
    }),
  );
  return normalized;
}
