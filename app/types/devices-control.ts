import type { Component } from "vue";

export type DeviceTabKey = "gateways" | "nodes" | "controller" | "sensor";

export type DeviceRowStatus = "online" | "inactive";

export type DeviceRow = {
  id: string;
  name: string;
  ip?: string | null;
  mac?: string | null;
  status: DeviceRowStatus;
  registered?: boolean;
  lastSeen?: string | null;
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
  description: string;
  icon?: Component;
  headline: string;
  body: string;
  cards: SectionCard[];
};
