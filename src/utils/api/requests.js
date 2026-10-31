import axiosInstance from "./axiosInstance";

const errorMessage = (error) => {
  if (error?.response) {
    return error.response.data?.message || `Server xətası (${error.response.status})`;
  }
  if (error?.request) {
    return "Serverə qoşulmaq mümkün olmadı. İnterneti yoxlayın.";
  }
  return error?.message || "Naməlum xəta baş verdi";
};

const handle = async (promise) => {
  try {
    const { data } = await promise;
    return data;
  } catch (error) {
    throw new Error(errorMessage(error), { cause: error });
  }
};

export const getData = (url, params) => handle(axiosInstance.get(url, { params }));
export const getOneData = (url, id, params) => handle(axiosInstance.get(`${url}/${id}`, { params }));
export const postData = (url, body, config) => handle(axiosInstance.post(url, body, config));
export const patchData = (url, body) => handle(axiosInstance.patch(url, body));
export const updateData = (url, body) => handle(axiosInstance.put(url, body));
export const deleteData = (url) => handle(axiosInstance.delete(url));
