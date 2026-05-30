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

import UsersList from "@/pages/iam/UsersList";
import UserDetail from "@/pages/iam/UserDetail";
import RolesList from "@/pages/iam/RolesList";
import GroupsList from "@/pages/iam/GroupsList";

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
import RouteDetail from "@/pages/fleetops/routes/RouteDetail";
import ServiceRatesList from "@/pages/fleetops/ServiceRatesList";
import ServiceRateForm from "@/pages/fleetops/ServiceRateForm";
import Orchestrator from "@/pages/fleetops/Orchestrator";
import SchedulePlanner from "@/pages/fleetops/SchedulePlanner";
import OrderConfigManager from "@/pages/fleetops/OrderConfigManager";
import VendorsList from "@/pages/fleetops/management/VendorsList";
import VendorDetail from "@/pages/fleetops/management/VendorDetail";
import ContactsList from "@/pages/fleetops/management/ContactsList";
import ContactDetail from "@/pages/fleetops/management/ContactDetail";
import IssuesList from "@/pages/fleetops/management/IssuesList";
import IssueDetail from "@/pages/fleetops/management/IssueDetail";
import IntegratedVendorsList from "@/pages/fleetops/management/IntegratedVendorsList";
import IntegratedVendorDetail from "@/pages/fleetops/management/IntegratedVendorDetail";
import FuelReportsList from "@/pages/fleetops/management/FuelReportsList";
import FuelReportDetail from "@/pages/fleetops/management/FuelReportDetail";
import TelematicsList from "@/pages/fleetops/connectivity/TelematicsList";
import TelematicDetail from "@/pages/fleetops/connectivity/TelematicDetail";
import DevicesList from "@/pages/fleetops/connectivity/DevicesList";
import DeviceDetail from "@/pages/fleetops/connectivity/DeviceDetail";
import SensorsList from "@/pages/fleetops/connectivity/SensorsList";
import SensorDetail from "@/pages/fleetops/connectivity/SensorDetail";
import DeviceEventsList from "@/pages/fleetops/connectivity/DeviceEventsList";
import DeviceEventDetail from "@/pages/fleetops/connectivity/DeviceEventDetail";
import FleetTrackingHub from "@/pages/fleetops/connectivity/FleetTrackingHub";
import MaintenanceSchedulesList from "@/pages/fleetops/maintenance/MaintenanceSchedulesList";
import MaintenanceScheduleDetail from "@/pages/fleetops/maintenance/MaintenanceScheduleDetail";
import MaintenancesList from "@/pages/fleetops/maintenance/MaintenancesList";
import MaintenanceDetail from "@/pages/fleetops/maintenance/MaintenanceDetail";
import WorkOrdersList from "@/pages/fleetops/maintenance/WorkOrdersList";
import WorkOrderDetail from "@/pages/fleetops/maintenance/WorkOrderDetail";
import EquipmentList from "@/pages/fleetops/maintenance/EquipmentList";
import EquipmentDetail from "@/pages/fleetops/maintenance/EquipmentDetail";
import PartsList from "@/pages/fleetops/maintenance/PartsList";
import PartDetail from "@/pages/fleetops/maintenance/PartDetail";
import RegistryHome from "@/pages/registry/RegistryHome";
import ChartOfAccounts from "@/pages/ledger/ChartOfAccounts";
import JournalEntries from "@/pages/ledger/JournalEntries";
import CheckoutPreview from "@/pages/storefront/CheckoutPreview";
import FleetOpsOnboarding from "@/pages/onboarding/FleetOpsOnboarding";
import PlatformHealth from "@/pages/admin/PlatformHealth";
import ServiceAreasList from "@/pages/fleetops/service-areas/ServiceAreasList";
import ServiceAreaDetail from "@/pages/fleetops/service-areas/ServiceAreaDetail";
import FleetopsSettingsLayout from "@/pages/fleetops/settings/FleetopsSettingsLayout";
import FleetopsSettingsHome from "@/pages/fleetops/settings/FleetopsSettingsHome";
import NavigatorSettingsPage from "@/pages/fleetops/settings/NavigatorSettingsPage";
import RoutingSettingsPage from "@/pages/fleetops/settings/RoutingSettingsPage";
import OrchestratorSettingsPage from "@/pages/fleetops/settings/OrchestratorSettingsPage";
import SchedulingSettingsPage from "@/pages/fleetops/settings/SchedulingSettingsPage";
import CustomFieldsList from "@/pages/fleetops/custom-fields/CustomFieldsList";
import CustomFieldDetail from "@/pages/fleetops/custom-fields/CustomFieldDetail";
import ReportsList from "@/pages/fleetops/analytics/ReportsList";
import ReportDetail from "@/pages/fleetops/analytics/ReportDetail";
import TrackOrderLookup from "@/pages/fleetops/tracking/TrackOrderLookup";

function App() {
    return (
        <div className="App">
                <Routes>
                    <Route element={<AuthLayout />}>
                        <Route path="/auth" element={<Login />} />
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
                          <Route path="/fleet-ops/operations/routes/:id" element={<RouteDetail />} />
                          <Route path="/fleet-ops/operations/orchestrator" element={<Orchestrator />} />
                          <Route path="/fleet-ops/operations/schedule" element={<SchedulePlanner />} />
                          <Route path="/fleet-ops/operations/order-config" element={<OrderConfigManager />} />
                          <Route path="/fleet-ops/operations/service-rates" element={<ServiceRatesList />} />
                          <Route path="/fleet-ops/operations/service-rates/new" element={<ServiceRateForm />} />
                          <Route path="/fleet-ops/operations/service-rates/:id" element={<ServiceRateForm />} />
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
                          <Route path="/fleet-ops/management/vendors/:id" element={<VendorDetail />} />
                          <Route path="/fleet-ops/management/integrated-vendors" element={<IntegratedVendorsList />} />
                          <Route path="/fleet-ops/management/integrated-vendors/:id" element={<IntegratedVendorDetail />} />
                          <Route path="/fleet-ops/management/contacts" element={<ContactsList />} />
                          <Route path="/fleet-ops/management/contacts/:id" element={<ContactDetail />} />
                          <Route path="/fleet-ops/management/fuel-reports" element={<FuelReportsList />} />
                          <Route path="/fleet-ops/management/fuel-reports/:id" element={<FuelReportDetail />} />
                          <Route path="/fleet-ops/management/issues" element={<IssuesList />} />
                          <Route path="/fleet-ops/management/issues/:id" element={<IssueDetail />} />
                          <Route path="/fleet-ops/connectivity/telematics" element={<TelematicsList />} />
                          <Route path="/fleet-ops/connectivity/telematics/:id" element={<TelematicDetail />} />
                          <Route path="/fleet-ops/connectivity/devices" element={<DevicesList />} />
                          <Route path="/fleet-ops/connectivity/devices/:id" element={<DeviceDetail />} />
                          <Route path="/fleet-ops/connectivity/sensors" element={<SensorsList />} />
                          <Route path="/fleet-ops/connectivity/sensors/:id" element={<SensorDetail />} />
                          <Route path="/fleet-ops/connectivity/device-events" element={<DeviceEventsList />} />
                          <Route path="/fleet-ops/connectivity/device-events/:id" element={<DeviceEventDetail />} />
                          <Route path="/fleet-ops/connectivity/tracking" element={<FleetTrackingHub />} />
                          <Route path="/fleet-ops/maintenance/schedules" element={<MaintenanceSchedulesList />} />
                          <Route path="/fleet-ops/maintenance/schedules/:id" element={<MaintenanceScheduleDetail />} />
                          <Route path="/fleet-ops/maintenance/records" element={<MaintenancesList />} />
                          <Route path="/fleet-ops/maintenance/records/:id" element={<MaintenanceDetail />} />
                          <Route path="/fleet-ops/maintenance/work-orders" element={<WorkOrdersList />} />
                          <Route path="/fleet-ops/maintenance/work-orders/:id" element={<WorkOrderDetail />} />
                          <Route path="/fleet-ops/maintenance/equipment" element={<EquipmentList />} />
                          <Route path="/fleet-ops/maintenance/equipment/:id" element={<EquipmentDetail />} />
                          <Route path="/fleet-ops/maintenance/parts" element={<PartsList />} />
                          <Route path="/fleet-ops/maintenance/parts/:id" element={<PartDetail />} />
                          <Route path="/fleet-ops/service-areas" element={<ServiceAreasList />} />
                          <Route path="/fleet-ops/service-areas/:id" element={<ServiceAreaDetail />} />
                          <Route path="/fleet-ops/custom-fields" element={<CustomFieldsList />} />
                          <Route path="/fleet-ops/custom-fields/:id" element={<CustomFieldDetail />} />
                          <Route path="/fleet-ops/analytics/reports" element={<ReportsList />} />
                          <Route path="/fleet-ops/analytics/reports/:id" element={<ReportDetail />} />
                          <Route path="/fleet-ops/tracking/lookup" element={<TrackOrderLookup />} />
                          <Route path="/fleet-ops/settings" element={<FleetopsSettingsLayout />}>
                            <Route index element={<FleetopsSettingsHome />} />
                            <Route path="navigator" element={<NavigatorSettingsPage />} />
                            <Route path="routing" element={<RoutingSettingsPage />} />
                            <Route path="orchestrator" element={<OrchestratorSettingsPage />} />
                            <Route path="scheduling" element={<SchedulingSettingsPage />} />
                          </Route>
                        </Route>

                        <Route path="/iam" element={<Navigate to="/iam/users" replace />} />
                        <Route path="/iam/users" element={<RequirePermission permission="users.view"><UsersList /></RequirePermission>} />
                        <Route path="/iam/users/:id" element={<RequirePermission permission="users.view"><UserDetail /></RequirePermission>} />
                        <Route path="/iam/roles" element={<RequirePermission permission="roles.view"><RolesList /></RequirePermission>} />
                        <Route path="/iam/groups" element={<RequirePermission permission="groups.view"><GroupsList /></RequirePermission>} />

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
                    </Route>

                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            <Toaster theme="dark" position="bottom-right" />
        </div>
    );
}

export default App;
