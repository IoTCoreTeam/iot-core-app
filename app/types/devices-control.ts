import type { Component } from "vue";

export type DeviceTabKey = "gateways" | "nodes";

export type DeviceRowStatus = "online" | "offline";

export type DeviceRow = {
  id: string;
  externalId?: string | null;
  name: string;
  gatewayId?: string | null;
  ip?: string | null;
  mac?: string | null;
  type?: string | null;
  status: DeviceRowStatus;
  registered?: boolean;
  lastSeen?: string | null;
};

export type NodeInfo = {
  id?: string | number | null;
  external_id?: string | null;
  name?: string | null;
  type?: string | null;
  gateway_id?: string | null;
  ip_address?: string | null;
  mac_address?: string | null;
  status?: string | null;
  registered?: boolean | null;
  last_seen?: string | null;
};

export type DeviceTab = {
  key: DeviceTabKey;
  label: string;
  rows: DeviceRow[];
};

export type DeviceFilterState = {
  name: string;
  serialNumber: string;
  connectionKey: string;
  location: string;
  ipAddress: string;
  status: string;
};

export type SectionCard = {
  kicker: string;
  title: string;
  description: string;
};

export type Section = {
  id: string;
  label: string;
  description?: string;
  icon?: Component;
  headline?: string;
  body?: string;
  cards?: SectionCard[];
};
