import type { Component } from "vue";

export type DeviceTabKey = "gateways" | "nodes" | "controller" | "sensor";

export type DeviceRow = {
  id: string;
  name: string;
  serialNumber: string;
  connectionKey: string;
  status: "pending" | "approved" | "deleted" | "active" | "inactive" | "registered";
  connectionHint?: string;
  location?: string;
  ipAddress?: string | null;
  updatedAt: string;
  updatedBy?: string;
  note?: string;
  lastHeartbeat?: string;
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
