import type { OrderDTO, WorkflowActivityDTO } from "@/src/types/api/orders";
import type { DriverDTO, FuelLogDTO, IssueDTO, NotificationDTO, PlaceDTO, RouteDTO, VehicleDTO } from "@/src/types/api/fleet";
import type { OrganizationDTO, UserDTO } from "@/src/types/api/auth";
import type { Driver, FuelLog, Issue, NotificationItem, Order, Place, Route, Vehicle } from "@/src/data/types";

export type Mapper<I, O> = (input: I) => O;

export type OrderMapper = Mapper<OrderDTO, Order>;
export type DriverMapper = Mapper<DriverDTO, Driver>;
export type VehicleMapper = Mapper<VehicleDTO, Vehicle>;
export type RouteMapper = Mapper<RouteDTO, Route>;
export type PlaceMapper = Mapper<PlaceDTO, Place>;
export type IssueMapper = Mapper<IssueDTO, Issue>;
export type FuelLogMapper = Mapper<FuelLogDTO, FuelLog>;
export type NotificationMapper = Mapper<NotificationDTO, NotificationItem>;

export type UserContract = UserDTO;
export type OrganizationContract = OrganizationDTO;
export type WorkflowActivityContract = WorkflowActivityDTO;

