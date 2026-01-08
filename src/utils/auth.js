const ROLE_KEY = "evtr_role";
const GROUP_KEY = "evtr_group";

export const getRole = () => {
  // prefer stored role
  const stored = localStorage.getItem(ROLE_KEY);
  if (stored) return stored;
  const params = new URLSearchParams(window.location.search);
  return params.get("key"); // MANAGER or VOLUNTEER
};

export const getGroupId = () => {
  const stored = localStorage.getItem(GROUP_KEY);
  if (stored) return Number(stored);
  const params = new URLSearchParams(window.location.search);
  return Number(params.get("group"));
};

export const setRole = (role) => {
  if (role) localStorage.setItem(ROLE_KEY, role);
};

export const setGroupId = (groupId) => {
  if (groupId !== undefined && groupId !== null) localStorage.setItem(GROUP_KEY, String(groupId));
};

export const clearAuth = () => {
  localStorage.removeItem(ROLE_KEY);
  localStorage.removeItem(GROUP_KEY);
};
