import { authFetch } from "./auth-fetch";
import { BACKEND_URL } from "./constants";

export type User = {
  id: string;
  name: string;
  email: string;
  image: string;
};

export const getUser = async (userId: string) => {
  const res = await authFetch<{ user: User }>(
    `${BACKEND_URL}/users/${userId}`,
    {
      method: "GET",
    }
  );
  return res.data;
};
