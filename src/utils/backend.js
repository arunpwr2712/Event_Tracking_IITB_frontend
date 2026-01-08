// Deprecated shim: runtime backend switching was removed.
// Use `REACT_APP_BACKEND_URL` and `REACT_APP_WS_URL` directly in your .env instead.

export const getBackendUrl = () => process.env.REACT_APP_BACKEND_URL || "";
export const getWsUrl = () => process.env.REACT_APP_WS_URL || "";
export const applyBackendToAxios = (axiosInstance) => {
  const url = getBackendUrl();
  if (url) axiosInstance.defaults.baseURL = url;
};
