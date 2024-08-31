import { Handler, Request, Response, NextFunction } from "express";

const cors = (): Handler => {
  return function cors(req: Request, res: Response, next: NextFunction) {
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET,POST,PUT,DELETE,OPTIONS"
    );
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Authorization, Origin, X-Requested-With, Content-Type, Accept, If-Modified-Since"
    );
    if (req.method == "OPTIONS") {
      return res.status(200).end();
    }
    next();
  };
};

export default cors;
