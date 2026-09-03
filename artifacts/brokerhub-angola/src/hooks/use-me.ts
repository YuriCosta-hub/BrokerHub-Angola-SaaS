import { useQuery } from "@tanstack/react-query";
import { fetchMe } from "@/lib/session";

export const meQueryKey = ["me"] as const;

export function useMe() {
  return useQuery({
    queryKey: meQueryKey,
    queryFn: ({ signal }) => fetchMe(signal),
    retry: false,
  });
}
