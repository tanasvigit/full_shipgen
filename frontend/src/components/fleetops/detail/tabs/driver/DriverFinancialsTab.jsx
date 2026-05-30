import DetailFieldGrid from "@/components/fleetops/detail/DetailFieldGrid";

export default function DriverFinancialsTab({ driverApi }) {
  const raw = driverApi || {};
  const fields = [
    { label: "Earnings", value: raw.earnings ?? raw.total_earnings ?? "—" },
    { label: "Fuel reimbursements", value: raw.fuel_reimbursements ?? "—" },
    { label: "Settlements", value: raw.settlements ?? raw.settlement_status ?? "—" },
    { label: "Payroll reference", value: raw.payroll_reference ?? "—" },
    { label: "Incentives", value: raw.incentives ?? "—" },
    { label: "Penalties", value: raw.penalties ?? "—" },
  ];

  return (
    <div className="p-4">
      <div className="bg-white border border-black/[0.08] rounded-md p-5">
        <DetailFieldGrid fields={fields} />
        {!raw.earnings && !raw.settlement_status && (
          <p className="text-xs text-[#6B7280] mt-4 font-mono">
            Financial fields populate when payroll/settlement APIs return data for this driver.
          </p>
        )}
      </div>
    </div>
  );
}
