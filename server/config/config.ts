const port = process.env.PORT;
if (!port) {
  console.error("缺少环境变量: PORT");
  process.exit(1);
}
const redisHost = process.env.REDIS_HOST;
const redisPort = process.env.REDIS_PORT || 6379;
const redisPassword = process.env.REDIS_PWD; // 内网redis可以不用密码
if (!redisHost) {
  console.error("缺少环境变量: REDIS_HOST");
  process.exit(1);
}
const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;
const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;
if (!accessTokenSecret || !refreshTokenSecret) {
  console.error("缺少环境变量: ACCESS_TOKEN_SECRET 或 REFRESH_TOKEN_SECRET");
  process.exit(1);
}
const mongodbUrl = process.env.MONGODB_URL;
if (!mongodbUrl) {
  console.error("缺少环境变量: MONGODB_URL");
  process.exit(1);
}
export default {
  isProduction: process.env.NODE_ENV === "production",
  port,
  redis: {
    host: redisHost,
    port: Number(redisPort),
    password: redisPassword,
  },
  mongodbUrl,
  accessTokenSecret,
  refreshTokenSecret,
  aliEmail: {
    user: process.env.ALI_EMAIL_USER,
    pass: process.env.ALI_EMAIL_PASS,
  },
};
