import { Handler, Request, Response, NextFunction } from "express";
import HttpErrors from "http-errors";
import redis from "../database/redis";
import { formatRetryTime } from "../utils/dateFormate";
import crypto from "node:crypto";
interface rateLimitOptions {
  windowMs: number;
  limit: number;
  key: string;
}
const createRateLimit = ({
  windowMs,
  limit,
  key,
}: rateLimitOptions): Handler => {
  return async function cors(req: Request, res: Response, next: NextFunction) {
    try {
      const ipHash = crypto
        .createHash("md5")
        .update(req.ip || "")
        .digest("hex");
      const redisKey = `ratelimit:${key}:${ipHash}`;
      // [[null, 1], [null, 1]]
      const replies = await redis
        .multi()
        .incr(redisKey)
        .expire(redisKey, windowMs)
        .exec();
      // 事务失败, 或事务中有一个命令失败
      if (!replies || replies.find((rep) => rep[0])) {
        console.log("redis事务失败", "key:", key, "replies:", replies);
        throw HttpErrors.InternalServerError();
      }
      const count = replies[0][1] as number;
      if (count > limit) {
        console.log(
          `redisKey:${redisKey}请求count:`,
          count,
          ",超过访问频率限制"
        );
        next(
          HttpErrors.TooManyRequests(
            `请求太频繁, 请在${formatRetryTime(windowMs)}后重试`
          )
        );
      }
      next();
    } catch (err) {
      next(err);
    }
  };
};

export default createRateLimit;
