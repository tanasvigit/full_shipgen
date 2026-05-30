export type OrderCoordinate = {
  latitude: number;
  longitude: number;
};

export type Order = {
  id: string;
  code: string;
  customer: string;
  pickup: string;
  dropoff: string;
  pickupCoordinate?: OrderCoordinate | null;
  dropoffCoordinate?: OrderCoordinate | null;
  status:
    | "created"
    | "dispatched"
    | "en_route"
    | "arrived"
    | "delivered"
    | "completed"
    | "canceled"
    | "cancelled"
    | "pending"
    | "assigned"
    | "in_transit"
    | "started"
    | "active"
    | "scheduled"
    | "failed"
    | "delayed";
  driverId: string;
  vehicleId: string;
  amount: number;
  distance: string;
  scheduledAt: string;
  createdAt: string;
  items: { name: string; qty: number; weight: string }[];
  timeline: { time: string; label: string; done: boolean }[];
};

export type Driver = {
  id: string;
  name: string;
  phone: string;
  email: string;
  rating: number;
  status: "online" | "idle" | "offline";
  avatar: string;
  vehicleId: string;
  licenseNo: string;
  trips: number;
  earnings: number;
  joinedAt: string;
  currentLocation: string;
};

export type Vehicle = {
  id: string;
  plate: string;
  model: string;
  type: "Truck" | "Van" | "Bike" | "Car";
  status: "active" | "idle" | "maintenance" | "offline";
  fuel: number;
  mileage: number;
  driverId: string;
  lastService: string;
  nextService: string;
  image: string;
};

export type Route = {
  id: string;
  name: string;
  stops: number;
  distance: string;
  duration: string;
  status: "active" | "scheduled" | "completed";
  driverId: string;
  vehicleId: string;
  waypoints: { name: string; address: string; eta: string; done: boolean }[];
};

export type Place = {
  id: string;
  name: string;
  address: string;
  type: "Warehouse" | "Customer" | "Hub";
  city: string;
  ordersCount: number;
};

export type Issue = {
  id: string;
  title: string;
  vehicleId: string;
  reportedBy: string;
  priority: "low" | "medium" | "high";
  status: "open" | "in_progress" | "resolved";
  reportedAt: string;
  description: string;
};

export type FuelLog = {
  id: string;
  vehicleId: string;
  driverId: string;
  amount: number;
  cost: number;
  date: string;
  station: string;
};

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  time: string;
  type: "order" | "driver" | "vehicle" | "system";
  read: boolean;
};
