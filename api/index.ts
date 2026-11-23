import type { Request, Response } from "express";
import app from "../server.js";

const allowedApiPaths = /^(health|stations|alerts|reports(?:\/[^/]+\/status)?|water-check\/evaluate|images\/(generate|edit))$/;

export default function handler(req: Request, res: Response) {
  const url = new URL(req.url, `http://${req.headers.host ?? "localhost"}`);
  const apiPaths = url.searchParams.getAll("__apiPath");
  const apiPath = apiPaths[apiPaths.length - 1];

  if (!apiPath || !allowedApiPaths.test(apiPath)) {
    res.statusCode = 404;
    res.setHeader("content-type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ error: "API route not found." }));
    return;
  }

  url.searchParams.delete("__apiPath");
  req.url = `/api/${apiPath}${url.search}`;
  app(req, res);
}
