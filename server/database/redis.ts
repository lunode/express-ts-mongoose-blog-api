import { Redis } from "ioredis";
import config from "../config/config";

const redis = new Redis({
  port: config.redis.port,
  host: config.redis.host,
  password: config.redis.password,
});
redis.on("connect", () => {
  console.log("redis connected successed");
});
/**
 * @param {string} id 用户id
 * @param {string} token 用户token
 */
const setRToken2redis = async (id: string, token: any) => {
  return await redis.set(`rtoken:${id}`, token, "EX", 365 * 24 * 3600);
};
/**
 * @param {string} id 用户id
 * @param {string} token 用户token
 */
const setAToken2redis = async (id: string, token: any) => {
  return await redis.set(`atoken:${id}`, token, "EX", 30 * 60);
};
/**
 * @param {string} id 用户id
 */
const getRTokenFromRedis = async (id: string) => {
  return await redis.get(`rtoken:${id}`);
};
const getATokenFromRedis = (id: string) => {
  return redis.get(`atoken:${id}`);
};
const removeRTokenFromRedis = async (id: string | undefined) => {
  if (!id) return null;
  return await redis.del(`rtoken:${id}`);
};
const removeATokenFromRedis = async (id: string | undefined) => {
  if (!id) return null;
  return await redis.del(`atoken:${id}`);
};
// TODO 柯里化封装 get set redis
export {
  redis,
  setRToken2redis,
  setAToken2redis,
  getRTokenFromRedis,
  getATokenFromRedis,
  removeRTokenFromRedis,
  removeATokenFromRedis,
};
export default redis;
