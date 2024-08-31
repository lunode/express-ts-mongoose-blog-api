import morgan from "morgan";
import { Request, Response, Handler } from "express";
export const morganMiddleware = (): Handler =>
  morgan(function (tokens, req: Request, res: Response) {
    return [
      `[${req.ip}]`,
      new Date().toLocaleString("zh"),
      tokens.method(req, res),
      tokens.url(req, res),
      tokens.status(req, res),
      tokens["response-time"](req, res),
      "ms",
      "-",
      tokens.res(req, res, "content-length"),
      tokens.req(req, res, "user-agent"),
    ].join(" ");
  });
