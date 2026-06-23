import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {

  bundleHasAnyData,

  fetchReportsBundle,

  overallReportsErrorMessage,

  type ReportQueryParams,

  type ReportRangeParams,

  type ReportsBundleResult,

} from '../api/reports';

import type { ReportsDashboardData, VehicleTypeFilter } from '../types/reports';

import { calendarDaysInRange } from '../utils/reportRange';

import type { ReportsSectionErrors } from '../utils/reportErrors';

import { vehicleTypeForApi, vehicleTypeLabel } from '../utils/vehicleType';



const BRAND_COLORS = {

  primary: '#ea1c26',

  dark: '#262427',

  accent: '#f59e0b',

};



export type ReportsFilterParams = ReportRangeParams & {

  vehicleType: VehicleTypeFilter;

};



function buildCategoryData(

  occupancy: NonNullable<ReportsBundleResult['occupancy']>,

  vehicleType: VehicleTypeFilter,

) {

  const slices = [

    { name: '2 Wheeler', value: occupancy.twoWheelerCount, color: BRAND_COLORS.primary },

    { name: '4 Wheeler', value: occupancy.fourWheelerCount, color: BRAND_COLORS.dark },

    {

      name: 'Other',

      value: occupancy.otherCount ?? 0,

      color: BRAND_COLORS.accent,

    },

  ];



  if (vehicleType === 'all') {

    return slices.filter((slice) => slice.value > 0);

  }



  const label = vehicleTypeLabel(vehicleType);

  const active = slices.find((slice) => slice.name === label);

  if (active && active.value > 0) {

    return [active];

  }

  return slices.filter((slice) => slice.value > 0);

}



function toApiParams(params: ReportsFilterParams): ReportQueryParams {

  const apiVehicleType = vehicleTypeForApi(params.vehicleType);

  if ('preset' in params) {

    return apiVehicleType ? { preset: params.preset, vehicleType: apiVehicleType } : { preset: params.preset };

  }

  return apiVehicleType

    ? { startDate: params.startDate, endDate: params.endDate, vehicleType: apiVehicleType }

    : { startDate: params.startDate, endDate: params.endDate };

}



function queryKey(params: ReportsFilterParams): string {

  const range = 'preset' in params ? params.preset : `${params.startDate}|${params.endDate}`;

  return `${range}:${params.vehicleType}`;

}



function mergeDashboardData(

  bundle: ReportsBundleResult,

  prev: ReportsDashboardData | null,

  params: ReportsFilterParams,

): ReportsDashboardData | null {

  const rangeLabel =

    bundle.revenue?.range ?? bundle.traffic?.range ?? bundle.occupancy?.range ?? prev?.rangeLabel ?? '';

  const rangeDayCount = calendarDaysInRange(params);



  const revenuePoints = bundle.revenue?.points ?? prev?.revenuePoints ?? [];

  const totalRevenue = bundle.revenue?.total ?? prev?.totalRevenue ?? 0;

  const totalEntries = bundle.traffic?.todayEntries ?? prev?.totalEntries ?? 0;

  const totalExits = bundle.traffic?.todayExits ?? prev?.totalExits ?? 0;

  const vehiclesInside = bundle.traffic?.vehiclesInside ?? prev?.vehiclesInside ?? 0;

  const occupancyPercent = bundle.occupancy?.occupancyPercent ?? prev?.occupancyPercent ?? 0;

  const categoryData = bundle.occupancy

    ? buildCategoryData(bundle.occupancy, params.vehicleType)

    : prev?.categoryData ?? [];



  if (!bundle.revenue && !bundle.traffic && !bundle.occupancy && !prev) {

    return null;

  }



  return {

    rangeLabel,

    vehicleTypeLabel: vehicleTypeLabel(params.vehicleType),

    revenuePoints,

    totalRevenue,

    totalEntries,

    totalExits,

    vehiclesInside,

    occupancyPercent,

    categoryData,

    rangeDayCount,

  };

}



function emptyDataHint(data: ReportsDashboardData | null): string | null {

  if (!data) {

    return null;

  }

  const noRevenue = data.totalRevenue === 0 && data.revenuePoints.length === 0;

  const noTraffic = data.totalEntries === 0 && data.totalExits === 0;

  if (noRevenue && noTraffic && data.categoryData.length === 0) {

    return 'No activity recorded for the selected period and filters.';

  }

  if (noRevenue) {

    return 'No revenue recorded for this period.';

  }

  return null;

}



export function useReportsDashboard(params: ReportsFilterParams) {

  const apiParams = useMemo(() => toApiParams(params), [params]);

  const [data, setData] = useState<ReportsDashboardData | null>(null);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [sectionErrors, setSectionErrors] = useState<ReportsSectionErrors>({});

  const hasLoadedRef = useRef(false);

  const key = queryKey(params);



  const load = useCallback(async () => {

    const isInitial = !hasLoadedRef.current;

    if (isInitial) {

      setLoading(true);

    } else {

      setRefreshing(true);

    }



    try {

      const bundle = await fetchReportsBundle(apiParams);

      setSectionErrors(bundle.errors);



      if (!bundleHasAnyData(bundle)) {

        setData((prev) => prev);

        setError(overallReportsErrorMessage(bundle.errors));

        return;

      }



      setData((prev) => mergeDashboardData(bundle, prev, params));

      setError(null);

      hasLoadedRef.current = true;

    } catch (unexpected) {

      setData((prev) => {

        if (prev) {

          return prev;

        }

        return null;

      });

      setError(

        unexpected instanceof Error

          ? unexpected.message

          : 'Unable to load report data. Try again or choose a different range.',

      );

    } finally {

      setLoading(false);

      setRefreshing(false);

    }

  }, [apiParams, key, params]);



  useEffect(() => {

    void load();

  }, [load]);



  const emptyHint = emptyDataHint(data);



  return { data, loading, refreshing, error, sectionErrors, emptyHint, reload: load };

}


