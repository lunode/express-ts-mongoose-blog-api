import mongoose, { ConnectOptions } from "mongoose";
import config from "../config/config";
const disConnectMongo = () => {
  mongoose.connection.close();
  mongoose.disconnect();
};
const connectMongo = () => {
  const options: ConnectOptions = {
    connectTimeoutMS: 10 * 1000,
  };
  mongoose
    .connect(config.mongodbUrl, options)
    .then(() => {
      console.log("mongoose connect successed");
    })
    .catch((err) => {
      console.error("mongoose connect failed", err);
      process.exit(1);
    });
  mongoose.connection.on("connectz ", () => {
    console.log("mongodb server connect successd");
  });
  return disConnectMongo;
};

export { disConnectMongo };
export default connectMongo;
