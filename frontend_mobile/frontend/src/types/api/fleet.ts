import type { IdRef } from "@/src/types/api/common";

export type DriverDTO = IdRef & {
  user_uuid?: string;
  name?: string;
  phone?: string;
  email?: string;
  rating?: number;
  online?: boolean;
  status?: "online" | "idle" | "offline" | string;
  avatar?: string;
  photo_url?: string;
  avatar_url?: string;
  vehicleId?: string;
  vehicle_id?: string;
  vehicle_uuid?: string;
  vehicle?: VehicleDTO | null;
  licenseNo?: string;
  license_no?: string;
  drivers_license_number?: string;
  trips?: number;
  orders_completed?: number;
  earnings?: number;
  joinedAt?: string;
  joined_at?: string;
  created_at?: string;
  currentLocation?: string;
  current_location?: string;
  city?: string;
  location?: Record<string, unknown> | string;
  meta?: Record<string, unknown>;
};

export type VehicleDTO = IdRef & {
  name?: string;
  display_name?: string;
  plate?: string;
  plate_number?: string;
  call_sign?: string;
  make?: string;
  model?: string;
  year?: string | number;
  vin?: string;
  type?: string;
  vehicle_type?: string;
  body_type?: string;
  status?: string;
  online?: boolean;
  fuel?: number;
  mileage?: number;
  odometer?: number;
  driverId?: string;
  driver_id?: string;
  driver_uuid?: string;
  driver_name?: string;
  driver?: DriverDTO | null;
  lastService?: string;
  last_service?: string;
  last_serviced_at?: string;
  nextService?: string;
  next_service?: string;
  next_service_at?: string;
  image?: string;
  photo_url?: string;
  avatar_url?: string;
  updated_at?: string;
  meta?: Record<string, unknown>;
  telematics?: Record<string, unknown>;
};

export type RouteDTO = IdRef & {
  name?: string;
  tracking_number?: string;
  order_public_id?: string;
  order_uuid?: string;
  order_status?: string;
  stops?: number;
  stop_count?: number;
  distance?: string | number;
  total_distance?: string | number;
  duration?: string | number;
  total_time?: string | number;
  status?: string;
  driverId?: string;
  driver_id?: string;
  driver_uuid?: string;
  driver_name?: string;
  driver?: DriverDTO | null;
  vehicleId?: string;
  vehicle_id?: string;
  vehicle_uuid?: string;
  vehicle?: VehicleDTO | null;
  details?: {
    assignments?: unknown[];
  };
  waypoints?: {
    name?: string;
    address?: string;
    eta?: string;
    done?: boolean;
  }[];
};

export type PlaceDTO = IdRef & {
  name?: string;
  address?: string;
  street1?: string;
  street2?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  country?: string;
  type?: "Warehouse" | "Customer" | "Hub" | string;
  ordersCount?: number;
  orders_count?: number;
  meta?: Record<string, unknown>;
};

export type IssueDTO = IdRef & {
  title?: string;
  type?: string;
  category?: string;
  vehicleId?: string;
  vehicle_id?: string;
  vehicle_uuid?: string;
  vehicle_name?: string;
  vehicle?: VehicleDTO | null;
  reportedBy?: string;
  reporter_name?: string;
  priority?: "low" | "medium" | "high" | string;
  status?: "open" | "in_progress" | "resolved" | string;
  reportedAt?: string;
  created_at?: string;
  description?: string;
  report?: string;
};

export type FuelLogDTO = IdRef & {
  vehicleId?: string;
  vehicle_id?: string;
  vehicle_uuid?: string;
  vehicle_name?: string;
  vehicle?: VehicleDTO | null;
  driverId?: string;
  driver_id?: string;
  driver_uuid?: string;
  driver_name?: string;
  driver?: DriverDTO | null;
  volume?: number;
  amount?: number;
  cost?: number;
  odometer?: number;
  metric_unit?: string;
  location?: string | { type?: string; coordinates?: number[] };
  date?: string;
  created_at?: string;
  station?: string;
};

export type NotificationDTO = IdRef & {
  title?: string;
  body?: string;
  time?: string;
  type?: "order" | "driver" | "vehicle" | "system" | string;
  read?: boolean;
};
