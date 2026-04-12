import axiosInstance from "../api/axios";

// Employee/Auth APIs
export const loginEmployee = (email, password) =>
  axiosInstance.post("/employe/login", { email, password });

export const signupEmployee = (data) =>
  axiosInstance.post("/employe/signup", data);

export const getCurrentUser = () =>
  axiosInstance.get("/employe/me");

export const verifyUser = () =>
  axiosInstance.get("/employe/verify");

// Bus APIs
export const listBuses = () =>
  axiosInstance.get("/bus/lister");

export const addBus = (busData) =>
  axiosInstance.post("/bus/ajouter", busData);

export const updateBus = (id, busData) =>
  axiosInstance.post(`/bus/modifier/${id}`, busData);

export const setBusStatut = (id, body) =>
  axiosInstance.post(`/bus/statut/${id}`, body);

// Employee APIs
export const listEmployees = () =>
  axiosInstance.get("/employe/lister");

export const addEmployee = (employeeData) =>
  axiosInstance.post("/employe/ajouter", employeeData);

export const updateEmployee = (id, employeeData) =>
  axiosInstance.post(`/employe/modifier/${id}`, employeeData);

export const deleteEmployee = (id) =>
  axiosInstance.get(`/employe/supprimer/${id}`);

// Line APIs
export const listLines = () =>
  axiosInstance.get("/ligne/lister");

export const addLine = (lineData) =>
  axiosInstance.post("/ligne/ajouter", lineData);

export const updateLine = (id, lineData) =>
  axiosInstance.post(`/ligne/modifier/${id}`, lineData);

export const setLineStatut = (id, body) =>
  axiosInstance.post(`/ligne/statut/${id}`, body);

// Planning APIs (alignées sur backend/src/Routes/planning.js)
export const addPlanning = (planningData) =>
  axiosInstance.post("/planning/ajouter", planningData);

export const updatePlanning = (id, planningData) =>
  axiosInstance.post(`/planning/modifier/${id}`, planningData);

export const deletePlanning = (id) =>
  axiosInstance.delete(`/planning/supprimer/${id}`);

export const getPlanningById = (id) =>
  axiosInstance.get(`/planning/${id}`);

export const publishPlanningById = (id, publie = true) =>
  axiosInstance.post(`/planning/publier/${id}`, { publie });

export const listPlanningByEmployee = (employeId) =>
  axiosInstance.get(`/planning/employe/${employeId}`);

export const listPlanningByLine = (ligneId) =>
  axiosInstance.get(`/planning/ligne/${ligneId}`);

export const listPlanningByBus = (busId) =>
  axiosInstance.get(`/planning/bus/${busId}`);

export const listPlanningByDateRange = (start, end) =>
  axiosInstance.get(`/planning/range`, { params: { start, end } });
