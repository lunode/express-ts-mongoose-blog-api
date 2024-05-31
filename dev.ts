// 开发测试用这个文件
import dotenv from "dotenv";
import path from "node:path";
dotenv.config({
  path: path.resolve(__dirname, "./.env"),
});
import serve from "./app";
import config from "./config/config";
serve(config.port);
// 运行和编译都是 commonjs模块，所以没有ES6的静态执行模块导入
// 不会出现模块已加载，但config还未读取到环境变量的问题
