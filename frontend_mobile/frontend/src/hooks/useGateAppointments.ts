import { useQuery } from "@tanstack/react-query";
import { fetchAppointmentsForDate } from "@/src/services/appointmentService";
import { todayIsoDate } from "@/src/lib/appointmentActions";

export function useGateAppointments(date = todayIsoDate()) {
  return useQuery({
    queryKey: ["yard", "appointments", date],
    queryFn: () => fetchAppointmentsForDate(date),
    refetchInterval: 60_000,
  });
}
