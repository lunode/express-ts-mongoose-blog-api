// 线上生产使用这个文件
import express, { urlencoded, json } from "express";
import http from "http";
import config from "./config/config";
import connectMongo from "./database/mongodb";
import corsMiddleware from "./middleware/cors";
import { morganMiddleware } from "./middleware/log";
import errorHandle from "./middleware/errorHandle";
import routeNotMath from "./middleware/routeNotMatch";
import router from "./router/router";

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", true);
// 日志中间件
app.use(morganMiddleware());
app.use(corsMiddleware());
app.use(urlencoded({ extended: true }));
app.use(json());
// 注册路由
app.use("/api/v1", router);
// 404 route not matched, 倒数第2个中间件
app.use(routeNotMath(app, { staticPath: ["/public"] }));
// error handler
app.use(errorHandle);
function runServer(port = config.port) {
  const disConnectMongo = connectMongo();
  process.on("SIGINT", () => {
    console.log("process signal SIGINT");
    disConnectMongo();
    process.exit(0);
  });
  const server = http.createServer(app).listen(port, () => {
    console.log("server start at: ", server.address());
    console.log("the upstream listen on http://localhost:" + port);
  });
  return server;
}
// 不能是其他文件导入
// if (!module.parent) {
//   runServer(config.port);
// }
if (import.meta.url === process.argv[1]) {
  runServer(config.port);
}
export default runServer;
