import { useQuery } from "@tanstack/react-query";
import { getData, getOneData } from "@/utils/api/requests";

export const useGet = (key, url, params, options = {}) =>
  useQuery({
    queryKey: [key, params],
    queryFn: () => getData(url, params),
    staleTime: Infinity,
    ...options,
  });

export const useGetOne = (key, url, id, options = {}) =>
  useQuery({
    queryKey: [key, id],
    queryFn: () => getOneData(url, id),
    enabled: id != null,
    ...options,
  });
