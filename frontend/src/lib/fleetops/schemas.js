import { z } from "zod";
import { DRIVER_STATUSES, ORDER_PRIORITIES, POD_METHODS, PLACE_TYPES, VEHICLE_STATUSES } from "./constants";

export const driverFormSchema = z.object({
  name: z.string().min(1, "Driver name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(3, "Phone is required"),
  password: z.string().min(8).optional().or(z.literal("")),
  licenseNumber: z.string().optional(),
  internalId: z.string().optional(),
  country: z.string().max(2).optional(),
  city: z.string().optional(),
  status: z.enum(DRIVER_STATUSES).default("active"),
  vehicleId: z.string().optional(),
  vendorId: z.string().optional(),
  latitude: z.union([z.string(), z.number()]).optional(),
  longitude: z.union([z.string(), z.number()]).optional(),
  skills: z.array(z.string()).optional(),
  maxTravelTime: z.union([z.string(), z.number()]).optional(),
  maxDistance: z.union([z.string(), z.number()]).optional(),
  timeWindowStart: z.string().optional(),
  timeWindowEnd: z.string().optional(),
});

export const vehicleFormSchema = z.object({
  name: z.string().min(1, "Vehicle name is required"),
  plate: z.string().min(1, "Plate number is required"),
  vin: z.string().optional(),
  make: z.string().optional(),
  model: z.string().optional(),
  year: z.union([z.string(), z.number()]).optional(),
  type: z.string().default("cargo_van"),
  status: z.enum(VEHICLE_STATUSES).default("operational"),
  driverId: z.string().optional(),
  fuelType: z.string().optional(),
  odometer: z.union([z.string(), z.number()]).optional(),
  payloadCapacity: z.union([z.string(), z.number()]).optional(),
  cargoVolume: z.union([z.string(), z.number()]).optional(),
  length: z.union([z.string(), z.number()]).optional(),
  width: z.union([z.string(), z.number()]).optional(),
  height: z.union([z.string(), z.number()]).optional(),
  ownershipType: z.string().optional(),
  description: z.string().optional(),
  latitude: z.union([z.string(), z.number()]).optional(),
  longitude: z.union([z.string(), z.number()]).optional(),
});

export const placeFormSchema = z
  .object({
    name: z.string().optional(),
    street1: z.string().optional(),
    address: z.string().optional(),
    street2: z.string().optional(),
    city: z.string().optional(),
    province: z.string().optional(),
    state: z.string().optional(),
    postalCode: z.string().optional(),
    country: z.string().optional(),
    phone: z.string().optional(),
    type: z.enum(PLACE_TYPES.map((t) => t.value)).default("pickup"),
    openingHours: z.string().optional(),
    securityAccessCode: z.string().optional(),
    notes: z.string().optional(),
    latitude: z.union([z.string(), z.number()]).optional(),
    longitude: z.union([z.string(), z.number()]).optional(),
  })
  .refine(
    (d) =>
      d.name?.trim() ||
      (d.street1?.trim() || d.address?.trim()) ||
      (d.latitude !== "" && d.latitude != null && d.longitude !== "" && d.longitude != null),
    { message: "Provide a name, street address, or map coordinates", path: ["name"] },
  );

export const fleetFormSchema = z.object({
  name: z.string().min(1, "Fleet name is required"),
  description: z.string().optional(),
  serviceAreaId: z.string().optional(),
  region: z.string().optional(),
  territory: z.string().optional(),
  status: z.string().optional(),
  managerName: z.string().optional(),
});

const waypointSchema = z.object({
  id: z.string(),
  placeId: z.string().optional(),
  customerId: z.string().optional(),
  type: z.enum(["pickup", "dropoff"]).default("dropoff"),
});

const entitySchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  sku: z.string().optional(),
  destinationId: z.string().optional(),
  quantity: z.union([z.string(), z.number()]).optional(),
  weight: z.union([z.string(), z.number()]).optional(),
});

export const orderFormSchema = z
  .object({
    orderConfigId: z.string().min(1, "Order type is required"),
    type: z.string().optional(),
    internalId: z.string().optional(),
    scheduledAt: z.string().optional(),
    customerId: z.string().optional(),
    facilitatorId: z.string().optional(),
    driverId: z.string().optional(),
    vehicleId: z.string().optional(),
    serviceType: z.string().optional(),
    status: z.string().optional(),
    priority: z.enum(ORDER_PRIORITIES).default("medium"),
    pickupId: z.string().optional(),
    dropoffId: z.string().optional(),
    returnId: z.string().optional(),
    multiWaypoint: z.boolean().default(false),
    waypoints: z.array(waypointSchema).default([]),
    entities: z.array(entitySchema).default([]),
    adhoc: z.boolean().default(false),
    adhocDistance: z.union([z.string(), z.number()]).optional(),
    dispatched: z.boolean().default(true),
    podRequired: z.boolean().default(false),
    podMethod: z.enum(POD_METHODS).optional(),
    timeWindowStart: z.string().optional(),
    timeWindowEnd: z.string().optional(),
    requiredSkills: z.array(z.string()).optional(),
    orchestratorPriority: z.union([z.string(), z.number()]).optional(),
    notes: z.string().optional(),
    dispatchNotes: z.string().optional(),
    instructions: z.string().optional(),
    serviceQuoteId: z.string().optional(),
    metadataPairs: z.array(z.object({ id: z.string(), key: z.string(), value: z.string() })).optional(),
    metaJson: z.string().optional(),
    files: z.array(z.object({ uuid: z.string(), name: z.string().optional() })).optional(),
  })
  .refine((d) => d.pickupId || d.dropoffId || (d.multiWaypoint && d.waypoints.some((w) => w.placeId)), {
    message: "Pickup and drop-off (or waypoints) are required",
    path: ["pickupId"],
  })
  .refine((d) => !d.podRequired || d.podMethod, {
    message: "POD method is required when proof of delivery is enabled",
    path: ["podMethod"],
  });

export const shiftFormSchema = z.object({
  driverId: z.string().min(1, "Driver is required"),
  day: z.string().min(1),
  start: z.union([z.string(), z.number()]),
  end: z.union([z.string(), z.number()]),
  notes: z.string().optional(),
});
