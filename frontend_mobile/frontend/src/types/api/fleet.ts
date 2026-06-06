import type { IdRef } from "@/src/types/api/common";

export type DriverDTO = IdRef & {
  user_uuid?: string;
  name?: string;
  phone?: string;
  email?: string;
  rating?: number;
  status?: "online" | "idle" | "offline" | string;
  avatar?: string;
  photo_url?: string;
  vehicleId?: string;
  vehicle_id?: string;
  licenseNo?: string;
  license_no?: string;
  trips?: number;
  earnings?: number;
  joinedAt?: string;
  joined_at?: string;
  currentLocation?: string;
  current_location?: string;
};

export type VehicleDTO = IdRef & {
  plate?: string;
  model?: string;
  type?: "Truck" | "Van" | "Bike" | "Car" | string;
  status?: "active" | "idle" | "maintenance" | "offline" | string;
  fuel?: number;
  mileage?: number;
  driverId?: string;
  driver_id?: string;
  lastService?: string;
  last_service?: string;
  nextService?: string;
  next_service?: string;
  image?: string;
  photo_url?: string;
};

export type RouteDTO = IdRef & {
  name?: string;
  stops?: number;
  distance?: string;
  duration?: string;
  status?: string;
  driverId?: string;
  vehicleId?: string;
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
  type?: "Warehouse" | "Customer" | "Hub" | string;
  city?: string;
  ordersCount?: number;
};

export type IssueDTO = IdRef & {
  title?: string;
  vehicleId?: string;
  vehicle_id?: string;
  vehicle_uuid?: string;
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
  driverId?: string;
  driver_id?: string;
  driver_uuid?: string;
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

