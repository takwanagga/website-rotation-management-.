import http from "./httpClient.js";

export const busService = {
  async list() {
    const { data } = await http.get("/bus/lister");
    return Array.isArray(data) ? data : [];
  },

  async create(payload) {
    const { data } = await http.post("/bus/ajouter", payload);
    return data;
  },

  async update(id, payload) {
    const { data } = await http.post(`/bus/modifier/${id}`, payload);
    return data;
  },

  async remove(id) {
    const { data } = await http.get(`/bus/supprimer/${id}`);
    return data;
  },

  async setStatut(id, statut) {
    const { data } = await http.post(`/bus/modifier/${id}`, { statut });
    return data;
  },
};
