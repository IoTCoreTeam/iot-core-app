import { io } from "socket.io-client";
import { message } from "ant-design-vue";
import { ref } from "vue";
import type { DeviceRow } from "@/types/devices-control";
import { apiConfig } from "~~/config/api";

export function useDeviceSocket() {
  const gatewayRows = ref<DeviceRow[]>([]);
  const nodeRows = ref<DeviceRow[]>([]);
  const controllerRows = ref<DeviceRow[]>([]);
  const sensorRows = ref<DeviceRow[]>([]);
  const activeDevicesMap = ref<Map<string, any>>(new Map());
  const selectedSensorId = ref<DeviceRow["id"] | null>(null);
  const socket = ref<any>(null);

  function transformToDeviceRow(device: any): DeviceRow {
    return {
      id: device.id,
      name: device.name,
      serialNumber: device.serial,
      connectionKey: device.connKey,
      status: device.status,
      location: device.location,
      ipAddress: device.ip,
      updatedAt: device.lastUpdate
        ? new Date(device.lastUpdate).toLocaleString()
        : "N/A",
      lastHeartbeat: device.lastUpdate
        ? new Date(device.lastUpdate).toLocaleString()
        : "",
      updatedBy: "System",
      note: "",
    };
  }

  function updateDeviceData(data: any) {
    try {
      console.log("dY\", Updating device data...");

      activeDevicesMap.value.clear();

      if (data.devices?.activeRegistered) {
        console.log("Active Registered:", data.devices.activeRegistered);
        data.devices.activeRegistered.forEach((device: any) => {
          const key = device.external_id || device.id;
          activeDevicesMap.value.set(key, device);
          console.log("  Added to activeMap:", key);
        });
      }

      console.log(
        "Active Devices Map size:",
        activeDevicesMap.value.size
      );
      console.log(
        "🗂 Active Devices Map keys:",
        Array.from(activeDevicesMap.value.keys())
      );

      if (data.gateways && Array.isArray(data.gateways)) {
        console.log("dYO? Processing", data.gateways.length, "gateways");
        gatewayRows.value = data.gateways.map((gw: any) => {
          const row = transformToDeviceRow(gw);
          console.log("  Gateway:", row.name, "Status:", row.status);
          return row;
        });
      }

      if (data.nodes && Array.isArray(data.nodes)) {
        nodeRows.value = data.nodes.map((node: any) =>
          transformToDeviceRow(node)
        );
      }

      const allSensors = [
        ...(data.devices?.activeRegistered || []),
        ...(data.devices?.inactiveRegistered || []),
        ...(data.devices?.unregistered || []),
      ];

      if (allSensors.length > 0) {
        sensorRows.value = allSensors.map((sensor: any) =>
          transformToDeviceRow(sensor)
        );

        if (!selectedSensorId.value && sensorRows.value.length > 0) {
          selectedSensorId.value = sensorRows.value[0]!.id;
        }
      }

      console.log("ƒo. Data update complete");
    } catch (error) {
      console.error("ƒ?O Error updating device data:", error);
      message.error("Failed to update device data");
    }
  }

  function requestDeviceStatus() {
    if (socket.value && socket.value.connected) {
      socket.value.emit("REQUEST_DEVICE_STATUS");
    }
  }

  function setupDeviceSocket() {
    if (socket.value) return;

    socket.value = io(apiConfig.server, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
      timeout: 20000,
    });

    socket.value.on("connect", () => {
      console.log(" WebSocket Connected to", apiConfig.server);
      console.log("Socket ID:", socket.value.id);
      console.log("Transport:", socket.value.io.engine.transport.name);
      message.success("Connected to device server");
      requestDeviceStatus();
    });

    socket.value.on("DEVICE_STATUS_UPDATE", (data: any) => {
      console.log("dY\"­ Received DEVICE_STATUS_UPDATE");
      console.log("Data:", {
        gateways: data.gateways?.length,
        nodes: data.nodes?.length,
        activeDevices: data.devices?.activeRegistered?.length,
      });
      updateDeviceData(data);
    });

    socket.value.on("disconnect", (reason: any) => {
      console.log("ƒ?O Disconnected. Reason:", reason);
      message.warning("Disconnected from device server");
    });

    socket.value.on("connect_error", (error: any) => {
      console.error("ƒsÿ‹,? Connection Error:", error.message);
      console.error("URL:", apiConfig.server);
      message.error(`Connection failed: ${error.message}`);
    });

    socket.value.on("reconnect", (attemptNumber: any) => {
      console.log(`ƒo. Reconnected after ${attemptNumber} attempts`);
      message.success("Reconnected to device server");
    });
  }

  function disconnectDeviceSocket() {
    if (socket.value) {
      socket.value.disconnect();
      socket.value = null;
    }
  }

  return {
    gatewayRows,
    nodeRows,
    controllerRows,
    sensorRows,
    activeDevicesMap,
    selectedSensorId,
    socket,
    setupDeviceSocket,
    disconnectDeviceSocket,
    requestDeviceStatus,
  };
}
