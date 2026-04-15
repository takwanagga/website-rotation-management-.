import http from "./httpClient.js";

export const employeeService = {
  async list() {
    const { data } = await http.get("/employe/lister");
    return Array.isArray(data) ? data : [];
  },

  async create(payload) {
    const { data } = await http.post("/employe/ajouter", payload);
    return data;
  },

  async update(id, payload) {
    const { data } = await http.post(`/employe/modifier/${id}`, payload);
    return data;
  },

  async remove(id) {
    const { data } = await http.post(`/employe/supprimer/${id}`);
    return data;
  },
};
