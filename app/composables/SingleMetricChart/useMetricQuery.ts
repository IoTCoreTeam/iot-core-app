import { ref, watch } from "vue";
import { apiConfig } from "~~/config/api";
import { useAuthStore } from "~~/stores/auth";
import type { TimeframeKey } from "@/types/dashboard";

const CONTROL_MODULE_BASE = (apiConfig.controlModule || "").replace(/\/$/, "");
const SENSOR_QUERY_BASE = (apiConfig.server || "").replace(/\/$/, "");

const sensorTypeMapping: Record<string, string> = {
  soilMoisture: "soil_moisture",
  airHumidity: "humidity",
};

const timeFieldMap: Record<string, string> = {
  second: "sec",
  minute: "minute",
  hour: "hour",
  day: "day",
};

interface UseMetricQueryProps {
  selectedMetricKey: string;
  selectedTimeframe: TimeframeKey;
  sensorIds?: string[];
  sensorType?: string;
  deviceId?: string;
}

function resolveNumericValue(input: unknown): number | null {
  if (input === null || input === undefined) {
    return null;
  }

  if (typeof input === "object") {
    const wrapper = input as {
      $numberDecimal?: string;
      $numberLong?: string;
      $numberDouble?: string;
      $numberInt?: string;
      value?: unknown;
    };
    const wrappedDecimal =
      wrapper.$numberDecimal ??
      wrapper.$numberLong ??
      wrapper.$numberDouble ??
      wrapper.$numberInt;
    if (typeof wrappedDecimal === "string") {
      const parsed = Number(wrappedDecimal);
      if (!Number.isNaN(parsed)) {
        return parsed;
      }
    }

    if ("value" in wrapper) {
      return resolveNumericValue(wrapper.value);
    }

    return null;
  }

  const normalized = Number(input);
  return Number.isFinite(normalized) ? normalized : null;
}

export function useMetricQuery(props: UseMetricQueryProps) {
  const authStore = useAuthStore();
  const fetchedSeries = ref<{ name: string; data: { x: string; y: number }[] }[]>(
    []
  );
  const isFetching = ref(false);
  const fetchError = ref<string | null>(null);
  const metricLimit = ref<number | null>(null);
  const hasMore = ref(false);
  const pageSize = ref(10);
  const currentPage = ref(1);

  function resolveSensorTypeForApi() {
    const sensorKey = props.sensorType || props.selectedMetricKey;
    if (!sensorKey) {
      return undefined;
    }
    return sensorTypeMapping[sensorKey] || sensorKey;
  }

  function resetPagination() {
    currentPage.value = 1;
    hasMore.value = false;
  }

  async function fetchData() {
    const ids = props.sensorIds || (props.deviceId ? [props.deviceId] : []);

    isFetching.value = true;
    fetchError.value = null;

    try {
      const time_field = timeFieldMap[props.selectedTimeframe] || "hour";

      const mappedType = resolveSensorTypeForApi();

      const params = new URLSearchParams();
      params.append("time_field", time_field);
      params.append("limit", String(pageSize.value));
      params.append("page", String(currentPage.value));

      if (mappedType) {
        params.append("sensor_type", mappedType);
      }
      if (ids.length > 0) {
        ids.forEach((id) => params.append("sensor_id", id));
      }

      const res = await fetch(
        `${SENSOR_QUERY_BASE}/v1/sensors/query?${params.toString()}`
      );

      if (!res.ok) throw new Error("API Error");

      const data = await res.json();

      data.sort((a: any, b: any) => {
        const getTimestamp = (item: any) =>
          item.timestamp || item._id?.timestamp || item._id?.time;
        return (
          new Date(getTimestamp(a)).getTime() -
          new Date(getTimestamp(b)).getTime()
        );
      });

      const renderData = data;
      hasMore.value = data.length >= pageSize.value;

      const groups: Record<string, any[]> = {};

      renderData.forEach((item: any) => {
        const sId =
          item._id?.sensorId || item.sensorId || item.id || "unknown-sensor";
        const time = item.timestamp || item._id?.timestamp || item._id?.time;
        const rawValue = item.value ?? item._id?.value;
        const normalizedValue = resolveNumericValue(rawValue);
        if (normalizedValue === null) {
          return;
        }
        const sensorName =
          item._id?.sensorName || item.sensorName || sId || "sensor";
        const sensorTypeLabel = item._id?.sensorType || item.sensorType;
        const name = sensorName || sensorTypeLabel || sId;

        if (!groups[name]) groups[name] = [];

        let label = time;
        try {
          const d = new Date(time);
          if (!isNaN(d.getTime())) {
            if (props.selectedTimeframe === "second")
              label = d.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              });
            else if (props.selectedTimeframe === "minute")
              label = d.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              });
            else if (props.selectedTimeframe === "hour")
              label = d.toLocaleTimeString([], {
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });
            else
              label = d.toLocaleDateString([], {
                month: "short",
                day: "numeric",
              });
          }
        } catch (e) {}

        groups[name].push({ x: label, y: normalizedValue });
      });

      fetchedSeries.value = Object.keys(groups).map((name) => ({
        name,
        data: groups[name] ?? [],
      }));
      hasMore.value = data.length >= pageSize.value;
    } catch (err: any) {
      console.error(err);
      fetchError.value = err.message || "Failed to fetch data";
      fetchedSeries.value = [];
      hasMore.value = false;
    } finally {
      isFetching.value = false;
    }
  }

  async function fetchMetricLimit() {
    const sensorType = resolveSensorTypeForApi();
    if (!sensorType) {
      metricLimit.value = null;
      return;
    }

    if (!CONTROL_MODULE_BASE || !authStore.authorizationHeader) {
      metricLimit.value = null;
      return;
    }

    const headers: Record<string, string> = {};
    if (authStore.authorizationHeader) {
      headers.Authorization = authStore.authorizationHeader;
    }

    try {
      const res = await fetch(
        `${CONTROL_MODULE_BASE}/node-sensors/metric-limit/${encodeURIComponent(
          sensorType
        )}`,
        { headers }
      );

      if (!res.ok) {
        throw new Error("Metric limit API error");
      }

      const payload = await res.json();

      if (!payload.success) {
        throw new Error(payload.message || "Metric limit not available");
      }

      const limitValue = Number(payload.data);
      metricLimit.value = Number.isNaN(limitValue) ? null : limitValue;
    } catch (err: any) {
      console.error(err);
      metricLimit.value = null;
    }
  }

  const refreshFilteredData = () => {
    resetPagination();
    fetchData();
  };

  watch(
    [
      () => props.selectedMetricKey,
      () => props.selectedTimeframe,
      () => props.sensorIds,
      () => props.sensorType,
      () => props.deviceId,
    ],
    refreshFilteredData,
    { immediate: true }
  );

  watch(
    [
      () => props.sensorType,
      () => props.selectedMetricKey,
      () => authStore.authorizationHeader,
    ],
    () => {
      fetchMetricLimit();
    },
    { immediate: true }
  );

  function goToPreviousPage() {
    if (currentPage.value <= 1) return;
    currentPage.value -= 1;
    fetchData();
  }

  function goToNextPage() {
    if (!hasMore.value) return;
    currentPage.value += 1;
    fetchData();
  }

  function setPageSize(value: number) {
    if (value === pageSize.value) return;
    pageSize.value = value;
    resetPagination();
    fetchData();
  }

  return {
    fetchedSeries,
    isFetching,
    fetchError,
    metricLimit,
    hasMore,
    pageSize,
    currentPage,
    goToPreviousPage,
    goToNextPage,
    setPageSize,
  };
}
