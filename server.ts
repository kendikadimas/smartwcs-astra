import { createServer } from "node:http";
import next from "next";
import { Server as SocketIOServer } from "socket.io";
import { env } from "./src/lib/env";
import { logger } from "./src/lib/logger";

const port = env.PORT;
const dev = env.NODE_ENV !== "production";

const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => handle(req, res));

  const io = new SocketIOServer(httpServer, {
    path: "/ws",
  });

  // ponytail: single global namespace for now, split into per-domain
  // namespaces (task/equipment/alarm) once those modules emit real events.
  io.on("connection", (socket) => {
    logger.info({ socketId: socket.id }, "socket.io client connected");
    socket.on("disconnect", () => {
      logger.info({ socketId: socket.id }, "socket.io client disconnected");
    });
  });

  httpServer.listen(port, () => {
    logger.info(`Smart WCS ready on http://localhost:${port} (ws: /ws)`);
  });
});
