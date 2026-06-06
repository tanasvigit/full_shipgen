import { driverService } from "@/src/services/driverService";

export const trackingService = {
  async uploadDriverLocation(driverId: string, latitude: number, longitude: number) {
    return driverService.uploadLocation(driverId, latitude, longitude);
  },
};

