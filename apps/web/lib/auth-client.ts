import { createAuthClient } from "better-auth/react";
import { BACKEND_URL } from "./constants";

export const authClient: ReturnType<typeof createAuthClient> = createAuthClient(
  {
    baseURL: `${BACKEND_URL}/auth`,
  }
);
