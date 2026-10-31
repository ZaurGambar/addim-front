import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { deleteData, patchData, postData, updateData } from "@/utils/api/requests";

const make = (fn) => (key, url, { successMessage, onSuccess } = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body) => fn(url, body),
    onSuccess: (data) => {
      if (key) queryClient.invalidateQueries({ queryKey: [key] });
      if (successMessage) toast.success(successMessage);
      onSuccess?.(data);
    },
    onError: (error) => toast.error(error.message),
  });
};

export const usePost = make(postData);
export const usePatch = make(patchData);
export const useUpdate = make(updateData);
export const useDelete = make((url) => deleteData(url));
