import http from "./httpClient.js";

export const notificationService = {
  async send(message, type, destinataireId) {
    return http.post("/notification/ajouter", {
      message,
      type,
      destinataire: destinataireId,
    });
  },

  async sendToMany(message, type, employeeIds) {
    return Promise.all(
      employeeIds.map(id => this.send(message, type, id))
    );
  },
};