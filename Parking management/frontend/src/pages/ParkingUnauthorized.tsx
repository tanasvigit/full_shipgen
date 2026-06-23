export default function ParkingUnauthorized() {
  return (
    <div className="mx-auto flex max-w-lg flex-col gap-3 px-6 py-10 text-sm text-slate-600">
      <h1 className="text-xl font-bold text-slate-900">Parking access denied</h1>
      <p>
        This Shipgen account does not have parking permissions. Parking operators should sign in with a parking
        account from the login page.
      </p>
    </div>
  );
}
