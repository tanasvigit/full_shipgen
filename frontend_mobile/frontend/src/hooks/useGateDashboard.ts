import { useQuery } from "@tanstack/react-query";
import { ymsRequest } from "@/src/lib/ymsApi";

export type GateDashboard = {
  gateId: string;
  kpis: {
    approaching: number;
    arrived: number;
    checkedIn: number;
    waiting: number;
    loadingPipeline: number;
    exitHolding: number;
    exitedToday: number;
  };
  activity: Array<{
    vehicleId: string;
    plate?: string;
    transporter?: string;
    driver?: string;
    appointment?: string;
    slot?: string;
    status?: string;
    activityTab?: string;
  }>;
};

export function useGateDashboard(gateId = "G1") {
  return useQuery({
    queryKey: ["yard", "gate", "dashboard", gateId],
    queryFn: () => ymsRequest<GateDashboard>(`/gate/dashboard?gate_id=${encodeURIComponent(gateId)}`),
    refetchInterval: 30_000,
  });
}
