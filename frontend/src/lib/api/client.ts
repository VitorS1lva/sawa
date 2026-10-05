import axios from "axios";
import { API_URL } from "./config";

/** Cliente HTTP único da aplicação. */
export const api = axios.create({
  baseURL: API_URL,
  timeout: 15_000,
});

let accessToken: string | null = null;

/** Guarda o token JWT recebido no login; ele passa a ir em todas as requisições. */
export function setAccessToken(token: string | null) {
  accessToken = token;
}

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

// TODO: ao receber 401, renovar o token com o refresh token (SimpleJWT) e repetir a requisição.
