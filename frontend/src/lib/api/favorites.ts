import { api } from "./client";
import { endpoints, USE_MOCKS } from "./config";
import type { FavoriteKind, Favorites } from "./types";

export async function getFavorites(): Promise<Favorites> {
  if (USE_MOCKS) return (await import("./mocks")).mockFavorites();
  const { data } = await api.get<Favorites>(endpoints.favorites);
  return data;
}

/** Adiciona (`favorite = true`) ou remove um favorito. */
export async function setFavorite(kind: FavoriteKind, id: string, favorite: boolean): Promise<void> {
  if (USE_MOCKS) return (await import("./mocks")).mockSetFavorite(kind, id, favorite);
  if (favorite) await api.post(endpoints.favorites, { kind, id });
  else await api.delete(endpoints.favorite(kind, id));
}
