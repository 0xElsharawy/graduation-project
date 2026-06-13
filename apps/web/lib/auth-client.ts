import { createAuthClient } from "better-auth/react";
import { PUBLIC_APP_URL } from "./constants";

export const authClient: ReturnType<typeof createAuthClient> = createAuthClient(
  {
    baseURL: `${PUBLIC_APP_URL}/auth`,
  }
);
