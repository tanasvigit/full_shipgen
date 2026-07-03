import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import "@/App.css";

import RequireAuth from "@/components/auth/RequireAuth";
import RequirePermission from "@/components/auth/RequirePermission";
import AuthLayout from "@/layouts/AuthLayout";
import ConsoleLayout from "@/layouts/ConsoleLayout";

import Login from "@/pages/auth/Login";
import ForgotPassword from "@/pages/auth/ForgotPassword";
import TwoFA from "@/pages/auth/TwoFA";
import Onboard from "@/pages/auth/Onboard";
import OnboardVerifyEmail from "@/pages/auth/OnboardVerifyEmail";

import Dashboard from "@/pages/Dashboard";
import Notifications from "@/pages/Notifications";
import Account from "@/pages/Account";
import Settings from "@/pages/Settings";

import OrdersList from "@/pages/fleetops/OrdersList";
import OrderNew from "@/pages/fleetops/OrderNew";
import DriversList from "@/pages/fleetops/DriversList";
import VehiclesList from "@/pages/fleetops/VehiclesList";
import PlacesList from "@/pages/fleetops/PlacesList";
import FleetsList from "@/pages/fleetops/FleetsList";
import FleetOpsModuleLayout from "@/layouts/FleetOpsModuleLayout";
import DetailRouteRedirect from "@/components/fleetops/detail/DetailRouteRedirect";

import IamHome from "@/pages/iam/IamHome";
import UsersList from "@/pages/iam/UsersList";
import UserDetail from "@/pages/iam/UserDetail";
import RolesList from "@/pages/iam/RolesList";
import GroupsList from "@/pages/iam/GroupsList";
import GroupDetail from "@/pages/iam/GroupDetail";
import PoliciesList from "@/pages/iam/PoliciesList";

import StorefrontHome from "@/pages/storefront/StorefrontHome";
import ProductsList from "@/pages/storefront/ProductsList";
import ProductDetail from "@/pages/storefront/ProductDetail";
import ProductNew from "@/pages/storefront/ProductNew";
import CatalogsList from "@/pages/storefront/CatalogsList";
import CustomersList from "@/pages/storefront/CustomersList";
import CustomerDetail from "@/pages/storefront/CustomerDetail";
import NetworksList from "@/pages/storefront/NetworksList";
import PromotionsList from "@/pages/storefront/PromotionsList";
import CouponsList from "@/pages/storefront/CouponsList";

import LedgerHome from "@/pages/ledger/LedgerHome";
import InvoicesList from "@/pages/ledger/InvoicesList";
import InvoiceDetail from "@/pages/ledger/InvoiceDetail";
import TransactionsList from "@/pages/ledger/TransactionsList";
import WalletsList from "@/pages/ledger/WalletsList";
import LedgerReports from "@/pages/ledger/LedgerReports";

import DevelopersHome from "@/pages/developers/DevelopersHome";
import ApiKeysList from "@/pages/developers/ApiKeysList";
import WebhooksList from "@/pages/developers/WebhooksList";
import WebhookDetail from "@/pages/developers/WebhookDetail";
import EventsList from "@/pages/developers/EventsList";
import LogsList from "@/pages/developers/LogsList";
import SocketsList from "@/pages/developers/SocketsList";

import PalletHome from "@/pages/pallet/PalletHome";
import InventoryList from "@/pages/pallet/InventoryList";
import WarehousesList from "@/pages/pallet/WarehousesList";
import TransfersList from "@/pages/pallet/TransfersList";
import SuppliersList from "@/pages/pallet/SuppliersList";
import PurchaseOrdersList from "@/pages/pallet/PurchaseOrdersList";

import RoutingOptimization from "@/pages/fleetops/RoutingOptimization";
import RoutesList from "@/pages/fleetops/routes/RoutesList";
import RouteNew from "@/pages/fleetops/routes/RouteNew";
import ServiceRatesList from "@/pages/fleetops/ServiceRatesList";
import ServiceRatesNewRedirect from "@/pages/fleetops/ServiceRatesNewRedirect";
import Orchestrator from "@/pages/fleetops/Orchestrator";
import SchedulePlanner from "@/pages/fleetops/SchedulePlanner";
import OrderConfigManager from "@/pages/fleetops/OrderConfigManager";
import VendorsList from "@/pages/fleetops/management/VendorsList";
import ContactsList from "@/pages/fleetops/management/ContactsList";
import IssuesList from "@/pages/fleetops/management/IssuesList";
import FleetopsCustomersList from "@/pages/fleetops/management/CustomersList";
import IntegratedVendorsList from "@/pages/fleetops/management/IntegratedVendorsList";
import FuelReportsList from "@/pages/fleetops/management/FuelReportsList";
import TelematicsList from "@/pages/fleetops/connectivity/TelematicsList";
import DevicesList from "@/pages/fleetops/connectivity/DevicesList";
import SensorsList from "@/pages/fleetops/connectivity/SensorsList";
import DeviceEventsList from "@/pages/fleetops/connectivity/DeviceEventsList";
import FleetTrackingHub from "@/pages/fleetops/connectivity/FleetTrackingHub";
import VehicleDevicesAdmin from "@/pages/fleetops/connectivity/VehicleDevicesAdmin";
import MaintenanceSchedulesList from "@/pages/fleetops/maintenance/MaintenanceSchedulesList";
import MaintenancesList from "@/pages/fleetops/maintenance/MaintenancesList";
import WorkOrdersList from "@/pages/fleetops/maintenance/WorkOrdersList";
import EquipmentList from "@/pages/fleetops/maintenance/EquipmentList";
import PartsList from "@/pages/fleetops/maintenance/PartsList";
import MaintenanceCalendarPage from "@/pages/fleetops/maintenance/MaintenanceCalendarPage";
import RegistryHome from "@/pages/registry/RegistryHome";
import YardModuleLayout from "@/layouts/YardModuleLayout";
import ParkingModuleLayout from "@/layouts/ParkingModuleLayout";
import ChartOfAccounts from "@/pages/ledger/ChartOfAccounts";
import JournalEntries from "@/pages/ledger/JournalEntries";
import CheckoutPreview from "@/pages/storefront/CheckoutPreview";
import FleetOpsOnboarding from "@/pages/onboarding/FleetOpsOnboarding";
import PlatformHealth from "@/pages/admin/PlatformHealth";
import ServiceAreasList from "@/pages/fleetops/service-areas/ServiceAreasList";
import FleetopsSettingsLayout from "@/pages/fleetops/settings/FleetopsSettingsLayout";
import FleetopsSettingsHome from "@/pages/fleetops/settings/FleetopsSettingsHome";
import NavigatorSettingsPage from "@/pages/fleetops/settings/NavigatorSettingsPage";
import RoutingSettingsPage from "@/pages/fleetops/settings/RoutingSettingsPage";
import OrchestratorSettingsPage from "@/pages/fleetops/settings/OrchestratorSettingsPage";
import SchedulingSettingsPage from "@/pages/fleetops/settings/SchedulingSettingsPage";
import NotificationsSettingsPage from "@/pages/fleetops/settings/NotificationsSettingsPage";
import AvatarsSettingsPage from "@/pages/fleetops/settings/AvatarsSettingsPage";
import PaymentsSettingsPage from "@/pages/fleetops/settings/PaymentsSettingsPage";
import EntityEditingSettingsPage from "@/pages/fleetops/settings/EntityEditingSettingsPage";
import GeofenceHub from "@/pages/fleetops/geo/GeofenceHub";
import CustomFieldsList from "@/pages/fleetops/custom-fields/CustomFieldsList";
import ReportsList from "@/pages/fleetops/analytics/ReportsList";
import ReportDetail from "@/pages/fleetops/analytics/ReportDetail";
import ReportBuilder from "@/pages/fleetops/analytics/ReportBuilder";
import ReportResult from "@/pages/fleetops/analytics/ReportResult";
import TrackOrderLookup from "@/pages/fleetops/tracking/TrackOrderLookup";
import WarrantiesList from "@/pages/fleetops/admin/WarrantiesList";
import ManifestsList from "@/pages/fleetops/admin/ManifestsList";
import PayloadsList from "@/pages/fleetops/admin/PayloadsList";
import EntitiesList from "@/pages/fleetops/admin/EntitiesList";
import ProofsList from "@/pages/fleetops/admin/ProofsList";
import PurchaseRatesList from "@/pages/fleetops/admin/PurchaseRatesList";
import TrackingNumbersList from "@/pages/fleetops/admin/TrackingNumbersList";
import TrackingStatusesList from "@/pages/fleetops/admin/TrackingStatusesList";

function App() {
    return (
        <div className="App">
                <Routes>
                    <Route element={<AuthLayout />}>
                        <Route path="/install" element={<Navigate to="/auth" replace />} />
                        <Route path="/auth" element={<Login />} />
                        <Route path="/auth/onboard" element={<Onboard />} />
                        <Route path="/auth/onboard/verify-email" element={<OnboardVerifyEmail />} />
                        <Route path="/auth/forgot-password" element={<ForgotPassword />} />
                        <Route path="/auth/two-fa" element={<TwoFA />} />
                    </Route>

                    <Route element={<RequireAuth><ConsoleLayout /></RequireAuth>}>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/notifications" element={<Notifications />} />
                        <Route path="/account" element={<Account />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="/onboarding" element={<FleetOpsOnboarding />} />
                        <Route path="/admin/health" element={<PlatformHealth />} />

                        <Route path="/fleet-ops" element={<Navigate to="/fleet-ops/operations/orders" replace />} />
                        <Route element={<FleetOpsModuleLayout />}>
                          <Route path="/fleet-ops/operations/orders" element={<OrdersList />} />
                          <Route path="/fleet-ops/operations/orders/new" element={<OrderNew />} />
                          <Route
                            path="/fleet-ops/operations/orders/:id"
                            element={<DetailRouteRedirect entityKey="order" />}
                          />
                          <Route path="/fleet-ops/operations/routing" element={<Navigate to="/fleet-ops/operations/routes" replace />} />
                          <Route path="/fleet-ops/operations/routes" element={<RoutesList />} />
                          <Route path="/fleet-ops/operations/routes/new" element={<RouteNew />} />
                          <Route
                            path="/fleet-ops/operations/routes/:id"
                            element={<DetailRouteRedirect entityKey="route" />}
                          />
                          <Route path="/fleet-ops/operations/orchestrator" element={<Orchestrator />} />
                          <Route path="/fleet-ops/operations/schedule" element={<SchedulePlanner />} />
                          <Route path="/fleet-ops/operations/order-config" element={<OrderConfigManager />} />
                          <Route path="/fleet-ops/operations/service-rates" element={<ServiceRatesList />} />
                          <Route path="/fleet-ops/operations/service-rates/new" element={<ServiceRatesNewRedirect />} />
                          <Route
                            path="/fleet-ops/operations/service-rates/:id"
                            element={<DetailRouteRedirect entityKey="serviceRate" />}
                          />
                          <Route path="/fleet-ops/management/drivers" element={<DriversList />} />
                          <Route
                            path="/fleet-ops/management/drivers/:id"
                            element={<DetailRouteRedirect entityKey="driver" />}
                          />
                          <Route path="/fleet-ops/management/vehicles" element={<VehiclesList />} />
                          <Route
                            path="/fleet-ops/management/vehicles/:id"
                            element={<DetailRouteRedirect entityKey="vehicle" />}
                          />
                          <Route path="/fleet-ops/management/places" element={<PlacesList />} />
                          <Route
                            path="/fleet-ops/management/places/:id"
                            element={<DetailRouteRedirect entityKey="place" />}
                          />
                          <Route path="/fleet-ops/management/fleets" element={<FleetsList />} />
                          <Route
                            path="/fleet-ops/management/fleets/:id"
                            element={<DetailRouteRedirect entityKey="fleet" />}
                          />
                          <Route path="/fleet-ops/management/vendors" element={<VendorsList />} />
                          <Route
                            path="/fleet-ops/management/vendors/:id"
                            element={<DetailRouteRedirect entityKey="vendor" />}
                          />
                          <Route path="/fleet-ops/management/integrated-vendors" element={<IntegratedVendorsList />} />
                          <Route
                            path="/fleet-ops/management/integrated-vendors/:id"
                            element={<DetailRouteRedirect entityKey="integratedVendor" />}
                          />
                          <Route path="/fleet-ops/management/contacts" element={<ContactsList />} />
                          <Route
                            path="/fleet-ops/management/contacts/:id"
                            element={<DetailRouteRedirect entityKey="contact" />}
                          />
                          <Route path="/fleet-ops/management/fuel-reports" element={<FuelReportsList />} />
                          <Route
                            path="/fleet-ops/management/fuel-reports/:id"
                            element={<DetailRouteRedirect entityKey="fuelReport" />}
                          />
                          <Route path="/fleet-ops/management/issues" element={<IssuesList />} />
                          <Route
                            path="/fleet-ops/management/issues/:id"
                            element={<DetailRouteRedirect entityKey="issue" />}
                          />
                          <Route path="/fleet-ops/management/customers" element={<FleetopsCustomersList />} />
                          <Route
                            path="/fleet-ops/management/customers/:id"
                            element={<DetailRouteRedirect entityKey="customer" />}
                          />
                          <Route path="/fleet-ops/connectivity/telematics" element={<TelematicsList />} />
                          <Route
                            path="/fleet-ops/connectivity/telematics/:id"
                            element={<DetailRouteRedirect entityKey="telematic" />}
                          />
                          <Route path="/fleet-ops/connectivity/devices" element={<DevicesList />} />
                          <Route
                            path="/fleet-ops/connectivity/devices/:id"
                            element={<DetailRouteRedirect entityKey="device" />}
                          />
                          <Route path="/fleet-ops/connectivity/sensors" element={<SensorsList />} />
                          <Route
                            path="/fleet-ops/connectivity/sensors/:id"
                            element={<DetailRouteRedirect entityKey="sensor" />}
                          />
                          <Route path="/fleet-ops/connectivity/device-events" element={<DeviceEventsList />} />
                          <Route
                            path="/fleet-ops/connectivity/device-events/:id"
                            element={<DetailRouteRedirect entityKey="deviceEvent" />}
                          />
                          <Route path="/fleet-ops/connectivity/tracking" element={<FleetTrackingHub />} />
                          <Route path="/fleet-ops/connectivity/vehicle-devices" element={<VehicleDevicesAdmin />} />
                          <Route path="/fleet-ops/maintenance/calendar" element={<MaintenanceCalendarPage />} />
                          <Route path="/fleet-ops/maintenance/schedules" element={<MaintenanceSchedulesList />} />
                          <Route
                            path="/fleet-ops/maintenance/schedules/:id"
                            element={<DetailRouteRedirect entityKey="maintenanceSchedule" />}
                          />
                          <Route path="/fleet-ops/maintenance/records" element={<MaintenancesList />} />
                          <Route
                            path="/fleet-ops/maintenance/records/:id"
                            element={<DetailRouteRedirect entityKey="maintenance" />}
                          />
                          <Route path="/fleet-ops/maintenance/work-orders" element={<WorkOrdersList />} />
                          <Route
                            path="/fleet-ops/maintenance/work-orders/:id"
                            element={<DetailRouteRedirect entityKey="workOrder" />}
                          />
                          <Route path="/fleet-ops/maintenance/equipment" element={<EquipmentList />} />
                          <Route
                            path="/fleet-ops/maintenance/equipment/:id"
                            element={<DetailRouteRedirect entityKey="equipment" />}
                          />
                          <Route path="/fleet-ops/maintenance/parts" element={<PartsList />} />
                          <Route
                            path="/fleet-ops/maintenance/parts/:id"
                            element={<DetailRouteRedirect entityKey="part" />}
                          />
                          <Route path="/fleet-ops/service-areas" element={<ServiceAreasList />} />
                          <Route
                            path="/fleet-ops/service-areas/:id"
                            element={<DetailRouteRedirect entityKey="serviceArea" />}
                          />
                          <Route path="/fleet-ops/geo/geofences" element={<GeofenceHub />} />
                          <Route path="/fleet-ops/custom-fields" element={<CustomFieldsList />} />
                          <Route
                            path="/fleet-ops/custom-fields/:id"
                            element={<DetailRouteRedirect entityKey="customField" />}
                          />
                          <Route path="/fleet-ops/analytics/reports" element={<ReportsList />} />
                          <Route path="/fleet-ops/analytics/reports/new" element={<ReportBuilder />} />
                          <Route path="/fleet-ops/analytics/reports/:id/edit" element={<ReportBuilder />} />
                          <Route path="/fleet-ops/analytics/reports/:id/result" element={<ReportResult />} />
                          <Route path="/fleet-ops/analytics/reports/:id" element={<ReportDetail />} />
                          <Route path="/fleet-ops/tracking/lookup" element={<TrackOrderLookup />} />
                          <Route path="/fleet-ops/admin/warranties" element={<WarrantiesList />} />
                          <Route
                            path="/fleet-ops/admin/warranties/:id"
                            element={<DetailRouteRedirect entityKey="warranty" />}
                          />
                          <Route path="/fleet-ops/admin/manifests" element={<ManifestsList />} />
                          <Route
                            path="/fleet-ops/admin/manifests/:id"
                            element={<DetailRouteRedirect entityKey="manifest" />}
                          />
                          <Route path="/fleet-ops/admin/payloads" element={<PayloadsList />} />
                          <Route
                            path="/fleet-ops/admin/payloads/:id"
                            element={<DetailRouteRedirect entityKey="payload" />}
                          />
                          <Route path="/fleet-ops/admin/entities" element={<EntitiesList />} />
                          <Route
                            path="/fleet-ops/admin/entities/:id"
                            element={<DetailRouteRedirect entityKey="entity" />}
                          />
                          <Route path="/fleet-ops/admin/proofs" element={<ProofsList />} />
                          <Route
                            path="/fleet-ops/admin/proofs/:id"
                            element={<DetailRouteRedirect entityKey="proof" />}
                          />
                          <Route path="/fleet-ops/admin/purchase-rates" element={<PurchaseRatesList />} />
                          <Route
                            path="/fleet-ops/admin/purchase-rates/:id"
                            element={<DetailRouteRedirect entityKey="purchaseRate" />}
                          />
                          <Route path="/fleet-ops/admin/tracking-numbers" element={<TrackingNumbersList />} />
                          <Route
                            path="/fleet-ops/admin/tracking-numbers/:id"
                            element={<DetailRouteRedirect entityKey="trackingNumber" />}
                          />
                          <Route path="/fleet-ops/admin/tracking-statuses" element={<TrackingStatusesList />} />
                          <Route
                            path="/fleet-ops/admin/tracking-statuses/:id"
                            element={<DetailRouteRedirect entityKey="trackingStatus" />}
                          />
                          <Route path="/fleet-ops/settings" element={<FleetopsSettingsLayout />}>
                            <Route index element={<FleetopsSettingsHome />} />
                            <Route path="navigator" element={<NavigatorSettingsPage />} />
                            <Route path="routing" element={<RoutingSettingsPage />} />
                            <Route path="orchestrator" element={<OrchestratorSettingsPage />} />
                            <Route path="scheduling" element={<SchedulingSettingsPage />} />
                            <Route path="notifications" element={<NotificationsSettingsPage />} />
                            <Route path="avatars" element={<AvatarsSettingsPage />} />
                            <Route path="payments" element={<PaymentsSettingsPage />} />
                            <Route path="entity-editing" element={<EntityEditingSettingsPage />} />
                          </Route>
                        </Route>

                        <Route path="/iam" element={<IamHome />} />
                        <Route path="/iam/users/drivers" element={<RequirePermission permission="users.view"><UsersList /></RequirePermission>} />
                        <Route path="/iam/users/customers" element={<RequirePermission permission="users.view"><UsersList /></RequirePermission>} />
                        <Route path="/iam/users/:id" element={<RequirePermission permission="users.view"><UserDetail /></RequirePermission>} />
                        <Route path="/iam/users" element={<RequirePermission permission="users.view"><UsersList /></RequirePermission>} />
                        <Route path="/iam/roles" element={<RequirePermission permission="roles.view"><RolesList /></RequirePermission>} />
                        <Route path="/iam/groups/:id" element={<RequirePermission permission="groups.view"><GroupDetail /></RequirePermission>} />
                        <Route path="/iam/groups" element={<RequirePermission permission="groups.view"><GroupsList /></RequirePermission>} />
                        <Route path="/iam/policies" element={<RequirePermission permission="policies.view"><PoliciesList /></RequirePermission>} />

                        <Route path="/storefront" element={<StorefrontHome />} />
                        <Route path="/storefront/products" element={<ProductsList />} />
                        <Route path="/storefront/products/new" element={<ProductNew />} />
                        <Route path="/storefront/products/:id" element={<ProductDetail />} />
                        <Route path="/storefront/catalogs" element={<CatalogsList />} />
                        <Route path="/storefront/customers" element={<CustomersList />} />
                        <Route path="/storefront/customers/:id" element={<CustomerDetail />} />
                        <Route path="/storefront/networks" element={<NetworksList />} />
                        <Route path="/storefront/promotions" element={<PromotionsList />} />
                        <Route path="/storefront/coupons" element={<CouponsList />} />
                        <Route path="/storefront/checkout" element={<CheckoutPreview />} />

                        <Route path="/ledger" element={<LedgerHome />} />
                        <Route path="/ledger/billing/invoices" element={<InvoicesList />} />
                        <Route path="/ledger/billing/invoices/:id" element={<InvoiceDetail />} />
                        <Route path="/ledger/payments/transactions" element={<TransactionsList />} />
                        <Route path="/ledger/payments/wallets" element={<WalletsList />} />
                        <Route path="/ledger/reports" element={<LedgerReports />} />
                        <Route path="/ledger/accounting/chart-of-accounts" element={<ChartOfAccounts />} />
                        <Route path="/ledger/accounting/journal" element={<JournalEntries />} />

                        <Route path="/developers" element={<DevelopersHome />} />
                        <Route path="/developers/api-keys" element={<ApiKeysList />} />
                        <Route path="/developers/webhooks" element={<WebhooksList />} />
                        <Route path="/developers/webhooks/:id" element={<WebhookDetail />} />
                        <Route path="/developers/events" element={<EventsList />} />
                        <Route path="/developers/logs" element={<LogsList />} />
                        <Route path="/developers/sockets" element={<SocketsList />} />

                        <Route path="/pallet" element={<PalletHome />} />
                        <Route path="/pallet/inventory" element={<InventoryList />} />
                        <Route path="/pallet/warehouses" element={<WarehousesList />} />
                        <Route path="/pallet/transfers" element={<TransfersList />} />
                        <Route path="/pallet/suppliers" element={<SuppliersList />} />
                        <Route path="/pallet/purchase-orders" element={<PurchaseOrdersList />} />

                        <Route path="/registry" element={<RegistryHome />} />

                        <Route path="/yard/*" element={<YardModuleLayout />} />
                        <Route path="/parking/*" element={<ParkingModuleLayout />} />
                    </Route>

                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            <Toaster theme="dark" position="bottom-right" />
        </div>
    );
}

export default App;
