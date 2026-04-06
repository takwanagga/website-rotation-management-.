import http from "./httpClient.js";

export const ligneService = {
  async list() {
    const { data } = await http.get("/ligne/lister");
    return Array.isArray(data) ? data : [];
  },

  async create(payload) {
    const { data } = await http.post("/ligne/ajouter", payload);
    return data;
  },

  async update(id, payload) {
    const { data } = await http.post(`/ligne/modifier/${id}`, payload);
    return data;
  },

  async remove(id) {
    const { data } = await http.get(`/ligne/supprimer/${id}`);
    return data;
  },
};
