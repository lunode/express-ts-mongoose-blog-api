import { Request, Response, NextFunction } from "express";
import { MongooseError } from "mongoose";
import config from "../config/config";
import { isHttpError } from "http-errors";
import { TokenExpiredError } from "jsonwebtoken";
import { UnAuthError } from "../error";
export default function (
  err: any,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) {
  console.log("error middleware: ", err);
  // 不能暴露堆栈信息, 对特殊Error单独处理业务错误
  let status = 500;
  let message = "Interval Error";
  let errCode = err.errCode; // 自定义error的code
  // 处理mongodb monoose错误
  if (
    err instanceof MongooseError ||
    (err.name && err.name.indexOf("Mongo") > -1)
  ) {
    if (!config.isProduction) {
      return res.status(500).send({
        error: {
          message: "Interval Error",
        },
        success: false,
      });
    }
  }
  if (isHttpError(err)) {
    status = err.status || err.statusCode;
    message = err.message;
  }
  if (err instanceof TokenExpiredError) {
    status = 401;
    message = err.message;
  }
  if (err instanceof UnAuthError) {
    status = err.status;
    message = err.message;
    errCode = err.errCode;
  }
  return res.status(status).send({
    error: {
      message,
      code: errCode,
    },
    success: false,
    data: null,
  });
}
