import { Response, NextFunction, Handler } from "express";
import { verifyAccessToken } from "../utils/token";
import { AuthRequest } from "../express";
import { getRTokenFromRedis, getATokenFromRedis } from "../database/redis";
import { UnAuthError } from "../error";
import HttpErrors from "http-errors";
import UserModel, { TypeUserRoleEnum } from "../model/UserModel";
interface AuthOption {
  ignorePath?: string[];
  role?: TypeUserRoleEnum; // 0 管理员, >0 普通用户
}
const auth = ({ ignorePath = [], role }: AuthOption = {}): Handler => {
  return async function auth(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      console.log("auth-middleware: ", req.originalUrl, ignorePath);
      if (ignorePath.includes(req.path)) {
        return next();
      }
      const authHeader = req.headers["authorization"];
      if (!authHeader) {
        console.log("auth header不存");
        throw HttpErrors.Unauthorized();
      }
      if (authHeader.indexOf("Bearer ") === -1) {
        console.log("Authorization Header不是Bearer");
        // 有auth header, 格式错误, 401 + error 提醒开发者
        throw UnAuthError.invalidTokenFormat();
      }
      const token = authHeader.split(" ")[1];
      if (!token) {
        console.log("Authorization Header存在但没有token");
        // 有auth header, 格式错误, 401 + error 提醒开发者
        throw UnAuthError.invalidTokenFormat();
      }
      // 解析失败会抛出 401
      const payload = verifyAccessToken(token);
      req.payload = payload;
      if (!payload) {
        throw UnAuthError.invalidToken();
      }
      // 用户可能调用login接口多次, 生成多个合法token, 只有和当前redis中相同才算合法
      const accessToken = await getATokenFromRedis(payload.aud as string);
      if (accessToken !== token) {
        console.log(
          "token失效, 用户token:",
          token,
          "redis缓存token:",
          accessToken
        );
        throw HttpErrors.Unauthorized();
      }
      /**
       * 还要判断用户的refreshToken是否存在于redis中
       * 不存在则有可能用户在退出登录前保留了access_token, 然后通过接口调用业务api, 这里也要认为他登录态失效
       */
      const refreshToken = await getRTokenFromRedis(payload.aud as string);
      if (!refreshToken) {
        // 有refreshToken说明登录过, 但accessToken过期了
        throw UnAuthError.userSignOut();
      }
      if (role !== undefined) {
        // 最后一步判断权限
        const user = await UserModel.findById(req.payload?.aud).select("+role");
        console.log("user");
        if (!user || user.role != role) {
          throw HttpErrors.Forbidden("权限不足"); // 403
        }
      }
      next();
    } catch (err) {
      console.log("auth error:", err);
      next(err);
    }
  };
};
export { TypeUserRoleEnum };
export default auth;
