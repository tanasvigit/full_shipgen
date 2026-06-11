import { useQuery } from "@tanstack/react-query";
import { useCompanyScope } from "@/src/hooks/useCompanyScope";
import { useFleetData } from "@/src/hooks/useFleetData";
import { fleetService } from "@/src/services/fleetService";
import type { Place } from "@/src/data/types";

export function usePlaceQuery(placeRef: string) {
  const { companyUuid } = useCompanyScope();
  const { findPlace } = useFleetData();
  const cached = findPlace(placeRef);

  return useQuery({
    queryKey: ["place", companyUuid, placeRef],
    queryFn: () => fleetService.getPlace(placeRef),
    enabled: Boolean(placeRef),
    initialData: cached,
    staleTime: cached ? 30_000 : 0,
  });
}

export function usePlaceCoordinateQuery(place: Place | null | undefined) {
  const { companyUuid } = useCompanyScope();
  const hasCoordinate = Boolean(place?.coordinate);

  return useQuery({
    queryKey: ["placeCoordinate", companyUuid, place?.id, place?.address],
    queryFn: async () => {
      if (!place || place.coordinate) return place?.coordinate || null;
      return fleetService.lookupPlaceCoordinate(place.address || place.name);
    },
    enabled: Boolean(place && !hasCoordinate && (place.address || place.name)),
    staleTime: 10 * 60 * 1000,
  });
}
