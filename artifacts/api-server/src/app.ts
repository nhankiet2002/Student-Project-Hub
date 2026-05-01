import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import session from "express-session";
import connectSessionFileStore from "session-file-store";
import path from "path";
import router from "./routes";
import { logger } from "./lib/logger";

declare module "express-session" {
  interface SessionData {
    userId: string | null;
  }
}

const FileStore = connectSessionFileStore(session);

const sessionsDir = path.join(process.cwd(), ".sessions");

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    store: new FileStore({
      path: sessionsDir,
      ttl: 7 * 24 * 60 * 60,
      retries: 0,
      logFn: () => {},
    }),
    secret: process.env.SESSION_SECRET ?? "promatch-dev-secret-change-in-prod",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: "lax",
      secure: false,
    },
    name: "pm.sid",
  }),
);

app.use("/api", router);

export default app;
