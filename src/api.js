import axios from "axios";

// Use build-time env var
axios.defaults.baseURL = process.env.REACT_APP_BACKEND_URL || "";

// Global interceptor: log useful debug info and attach a friendly message for 404s
axios.interceptors.response.use(
  (res) => res,
  (err) => {
    try {
      const method = (err.config && err.config.method && err.config.method.toUpperCase()) || "UNKNOWN";
      const url = (err.config && err.config.url) || "UNKNOWN";
      const status = err.response && err.response.status;
      const data = err.response && err.response.data;
      console.error("API ERROR:", { method, url, status, data });
      // Attach structured info to the error for callers to use
      err.apiInfo = { method, url, status, data };
      if (status === 404) {
        err.friendlyMessage = `Request ${method} ${url} returned 404 Not Found.`;
      } else if (status) {
        err.friendlyMessage = `Request ${method} ${url} failed: HTTP ${status}`;
      } else {
        err.friendlyMessage = err.message || "Network or CORS error";
      }
    } catch (e) {
      // ignore interceptor errors
    }
    return Promise.reject(err);
  }
);

export const enterLab = (groupId, labId) =>
  axios.post("/enter_lab", null, {
    params: { group_id: groupId, lab_id: labId },
  });

export const exitLab = (groupId) =>
  axios.post("/exit_lab", null, {
    params: { group_id: groupId },
  });

export const fetchStatus = () => axios.get("/status");

// Lab CRUD
export const createLab = (name) => axios.post("/labs", { name });
export const updateLab = async (labId, name) => {
  // Primary: send JSON body
  try {
    return await axios.put(`/labs/${labId}`, { name });
  } catch (err) {
    // If server rejects with 422, try sending as query param (some backends expect this format)
    if (err?.response?.status === 422) {
      return await axios.put(`/labs/${labId}`, null, { params: { name } });
    }
    throw err;
  }
};
export const deleteLab = (labId) => axios.delete(`/labs/${labId}`);

// Group CRUD
export const createGroup = (volunteer_name) => axios.post("/groups", { volunteer_name });
export const updateGroup = (groupId, volunteer_name) => axios.put(`/groups/${groupId}`, { volunteer_name });
export const deleteGroup = (groupId) => axios.delete(`/groups/${groupId}`);

// Assign / Unassign
export const assign = async (groupId, labId) => {
  // Send both query params and JSON body to satisfy different backend parsers
  try {
    return await axios.post(`/assign`, { group_id: groupId, lab_id: labId }, { params: { group_id: groupId, lab_id: labId } });
  } catch (err) {
    // If server rejects params, try as form-encoded body
    if (err?.response?.status === 422) {
      const body = new URLSearchParams();
      body.append("group_id", groupId);
      body.append("lab_id", labId);
      return await axios.post(`/assign`, body, { headers: { "Content-Type": "application/x-www-form-urlencoded" } });
    }
    throw err;
  }
};

export const unassign = async (groupId, labId) => {
  try {
    return await axios.post(`/unassign`, { group_id: groupId, lab_id: labId }, { params: { group_id: groupId, lab_id: labId } });
  } catch (err) {
    if (err?.response?.status === 422) {
      const body = new URLSearchParams();
      body.append("group_id", groupId);
      body.append("lab_id", labId);
      return await axios.post(`/unassign`, body, { headers: { "Content-Type": "application/x-www-form-urlencoded" } });
    }
    throw err;
  }
};
