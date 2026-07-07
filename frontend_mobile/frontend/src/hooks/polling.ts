export const YARD_POLL_MS = 30_000;

export const yardPollingOptions = {
  refetchInterval: YARD_POLL_MS,
  refetchIntervalInBackground: false,
  refetchOnWindowFocus: false,
  staleTime: 10_000,
};
