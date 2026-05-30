# Fleetbase Mobile (Static Demo)

A React Native (Expo Router) mobile app replicating the Fleetbase fleet & logistics operations platform. Uses static/dummy data — no backend.

## Modules covered
- **Auth**: demo login (any email/password accepted)
- **Dashboard**: KPIs, weekly revenue chart, quick access, active orders, online drivers strip, recent activity
- **Orders**: searchable & filterable order list, detail view with timeline, items, driver/vehicle, POD-ready timeline
- **Tracking**: stylized live map with driver markers, active trips, selectable trip detail
- **Fleet (Vehicles)**: vehicle list with fuel/status, vehicle detail (fuel, mileage, maintenance, driver)
- **Drivers**: list and full driver profile with stats, assigned vehicle, recent orders, call/message
- **Routes**: route list + route detail with waypoints
- **Places**: warehouses, hubs, customers
- **Issues**: vehicle service issues with priority
- **Fuel reports**: refueling logs with totals
- **Notifications**: activity feed with read/unread state
- **Profile/Settings**: profile, workspace, modules nav, preferences toggles, sign out

## Stack
- Expo SDK 54, expo-router 6, React Native 0.81, TypeScript
- Static mock data in `src/data/mockData.ts`
- No backend, no DB

## Routes
- `/` — login
- `/(tabs)/dashboard` `/(tabs)/orders` `/(tabs)/tracking` `/(tabs)/fleet` `/(tabs)/profile`
- `/order/[id]` `/driver/[id]` `/vehicle/[id]` `/route/[id]`
- `/drivers` `/routes` `/places` `/issues` `/fuel` `/notifications`

## Demo credentials
- Email: `admin@fleetbase.io`
- Password: `demo1234`
- (Any combination works — login is static.)
