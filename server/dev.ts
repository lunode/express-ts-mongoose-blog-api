import "./config/loadEnv";
import config from "./config/config";
import runServer from "./app";
runServer(config.port);
