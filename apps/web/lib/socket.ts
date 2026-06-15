import { io, Socket } from "socket.io-client";
import { BACKEND_URL } from "./constants";

// Assuming BACKEND_URL ends with '/api'
const socketUrl = BACKEND_URL.replace("/api", "");

export const chatSocket: Socket = io(`${socketUrl}/chat`, {
  withCredentials: true,
  autoConnect: false,
});

