import http from "./httpClient.js";

function normalizeBus(bus = {}) {
  const matricule = bus.matricule ?? bus.immatriculation ?? "";
  const status = bus.status ?? bus.statut ?? "disponible";
  const model = bus.model ?? bus.type ?? "";
  return {
    ...bus,
    matricule,
    status,
    model,
    immatriculation: matricule,
    statut: status,
    type: bus.type ?? model,
  };
}

function toBusPayload(payload = {}) {
  return {
    model: payload.model ?? payload.type ?? payload.numero ?? "",
    matricule: payload.matricule ?? payload.immatriculation ?? "",
    status: payload.status ?? payload.statut ?? "disponible",
  };
}

export const busService = {
  async list() {
    const { data } = await http.get("/bus/lister");
    return Array.isArray(data) ? data.map(normalizeBus) : [];
  },

  async create(payload) {
    const { data } = await http.post("/bus/ajouter", toBusPayload(payload));
    return normalizeBus(data);
  },

  async update(id, payload) {
    const { data } = await http.post(`/bus/modifier/${id}`, toBusPayload(payload));
    return normalizeBus(data);
  },

  async setStatut(id, statut) {
    const { data } = await http.post(`/bus/statut/${id}`, { status: statut });
    return data?.updatedBus ? normalizeBus(data.updatedBus) : normalizeBus(data);
  },
};
