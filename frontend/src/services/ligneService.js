import http from "./httpClient.js";

function normalizeLigne(ligne = {}) {
  return {
    ...ligne,
    libelle: ligne.libelle ?? "",
    debutDeLigne: ligne.debutDeLigne ?? "",
    finDeLigne: ligne.finDeLigne ?? "",
    distance: ligne.distance ?? 0,
    status: ligne.status ?? "actif",
  };
}

function toLignePayload(payload = {}) {
  return {
    libelle: payload.libelle ?? "",
    debutDeLigne: payload.debutDeLigne ?? "",
    finDeLigne: payload.finDeLigne ?? "",
    distance: payload.distance ? Number(payload.distance) : 0,
    status: payload.status ?? "actif",
  };
}

export const ligneService = {
  async list() {
    const { data } = await http.get("/ligne/lister");
    return Array.isArray(data) ? data.map(normalizeLigne) : [];
  },

  async create(payload) {
    const { data } = await http.post("/ligne/ajouter", toLignePayload(payload));
    return normalizeLigne(data);
  },

  async update(id, payload) {
    const { data } = await http.post(`/ligne/modifier/${id}`, toLignePayload(payload));
    return normalizeLigne(data);
  },


};
