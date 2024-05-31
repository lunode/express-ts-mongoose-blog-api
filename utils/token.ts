import jwt, { JwtPayload, TokenExpiredError } from "jsonwebtoken";
import config from "../config/config";
import { setRToken2redis, setAToken2redis } from "../database/redis";
import HttpErrors from "http-errors";
import { UnAuthError } from "../error";
const signAccessToken = async (id: string): Promise<string | undefined> => {
  console.log("signAccessToken, id:", id);
  return new Promise((res, rej) => {
    jwt.sign(
      {},
      config.accessTokenSecret,
      {
        audience: id,
        expiresIn: "30m", // 30分钟
        issuer: "",
      },
      function (err, token) {
        console.log("signAccesToken, err", err, "token: ", token);
        if (err) {
          // 生成token失败的堆栈和错误信息不能返回给用户
          rej(config.isProduction ? HttpErrors.InternalServerError() : err);
        } else {
          // jwt签名token可能返回undefined, ioredis默认会处理undefined为空字符
          setAToken2redis(id, token)
            .then(() => {
              res(token);
            })
            .catch((err: any) => {
              // token存储到redis失败的堆栈和错误信息不能返回给用户
              rej(config.isProduction ? HttpErrors.InternalServerError() : err);
            });
        }
      }
    );
  });
};
const signRefreshToken = async (id: string): Promise<string | undefined> => {
  console.log("signRefrehToken, id:", id);
  return new Promise((res, rej) => {
    jwt.sign(
      {},
      config.refreshTokenSecret,
      {
        audience: id,
        expiresIn: "30d", // 30天
        issuer: "",
      },
      function (err, token) {
        console.log("signRefreshToken, err", err, "token: ", token);
        if (err) {
          // 生成token失败的堆栈和错误信息不能返回给用户
          rej(config.isProduction ? HttpErrors.InternalServerError() : err);
        } else {
          // jwt签名token可能返回undefined, ioredis默认会处理undefined为空字符
          setRToken2redis(id, token)
            .then(() => {
              res(token);
            })
            .catch((err: any) => {
              // token存储到redis失败的堆栈和错误信息不能返回给用户
              rej(config.isProduction ? HttpErrors.InternalServerError() : err);
            });
        }
      }
    );
  });
};
const verifyAccessToken = (token: string) => {
  try {
    return jwt.verify(token, config.accessTokenSecret, {
      issuer: "",
    }) as JwtPayload;
  } catch (err) {
    if (config.isProduction) {
      throw HttpErrors.Unauthorized();
    }
    throw err;
  }
};
const verifyRefreshToken = (token: string): JwtPayload => {
  try {
    return jwt.verify(token, config.refreshTokenSecret, {
      issuer: "",
    }) as JwtPayload;
  } catch (err) {
    if (err instanceof TokenExpiredError) {
      throw UnAuthError.tokenExpired();
    }
    // 其他类型的 token校验 error
    if (config.isProduction) {
      throw HttpErrors.Unauthorized();
    }
    throw err;
  }
};
export {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
