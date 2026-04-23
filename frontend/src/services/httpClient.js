/**
 * Client HTTP unique pour toute l'application (Axios + intercepteurs).
 * Les services métier importent ce module, pas axios directement.
 */
export { default } from "../api/axios.js";
