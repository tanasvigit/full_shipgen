import type { IdRef } from "@/src/types/api/common";

export type OrderItemDTO = {
  name?: string;
  qty?: number;
  quantity?: number;
  weight?: string | number;
};

export type TimelineStepDTO = {
  time?: string;
  at?: string;
  label?: string;
  name?: string;
  done?: boolean;
  completed?: boolean;
};

export type PlaceDTO = {
  name?: string;
  address?: string;
  street1?: string;
  latitude?: number;
  longitude?: number;
  lat?: number;
  lng?: number;
  location?: { latitude?: number; longitude?: number; lat?: number; lng?: number };
  coordinates?: { latitude?: number; longitude?: number; lat?: number; lng?: number };
};

export type OrderDTO = IdRef & {
  tracking_number?: string;
  internal_id?: string;
  status?: string;
  customer?: { name?: string };
  customer_name?: string;
  pickup?: PlaceDTO | string;
  pickup_place?: PlaceDTO | string;
  dropoff?: PlaceDTO | string;
  dropoff_place?: PlaceDTO | string;
  driver?: IdRef & { name?: string; user?: { name?: string }; vehicle?: IdRef; vehicle_uuid?: string; vehicle_name?: string };
  driver_assigned?: IdRef & { name?: string; user?: { name?: string }; vehicle?: IdRef; vehicle_uuid?: string; vehicle_name?: string };
  driver_assigned_uuid?: string;
  vehicle?: IdRef & { plate_number?: string; name?: string; make?: string; model?: string };
  vehicle_assigned?: IdRef & { plate_number?: string; name?: string; make?: string; model?: string };
  vehicle_assigned_uuid?: string;
  vehicle_uuid?: string;
  vehicle_id?: string;
  vehicle_name?: string;
  total?: number;
  amount?: number;
  distance?: number | string;
  scheduled_at?: string;
  eta?: string;
  created_at?: string;
  payload?: { items?: OrderItemDTO[] };
  timeline?: TimelineStepDTO[];
};

export type WorkflowActivityDTO = {
  key?: string;
  code?: string;
  status?: string;
  details?: string;
  complete?: boolean;
  require_pod?: boolean;
  pod_method?: string;
  [k: string]: unknown;
};

export type TrackingUploadRequestDTO = {
  latitude: number;
  longitude: number;
  lat: number;
  lng: number;
};

