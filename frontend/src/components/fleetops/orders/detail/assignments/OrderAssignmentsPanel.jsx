import CollapsibleSection from "../CollapsibleSection";

export default function OrderAssignmentsPanel({ driver, vehicle }) {
  return (
    <CollapsibleSection title="Assignments" testId="order-assignments" defaultOpen>
      <div className="text-sm space-y-2">
        <div>
          <span className="text-[#4B5563]">Driver · </span>
          {driver?.name || "Unassigned"}
        </div>
        <div>
          <span className="text-[#4B5563]">Vehicle · </span>
          {vehicle?.name || vehicle?.plate || "Unassigned"}
        </div>
      </div>
    </CollapsibleSection>
  );
}
