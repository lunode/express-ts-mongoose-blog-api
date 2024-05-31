import mongoose, { Schema, Model, Document } from "mongoose";
import crypto from "crypto";
import Joi from "joi";
enum TypeUserRoleEnum {
  admin = 0, // 虽然只有admin和user两种角色, 还是有留下空隙方便以后升级
  user = 10,
}
// ---- 定义类型
interface UserSchema {
  email: string;
  password: string;
  name?: string;
  avatar?: string;
  role?: TypeUserRoleEnum;
  createdAt: Date;
  updatedAt: Date;
}
interface userMethods {
  isValidatedPwd(this: UserSchema, pwd: string): boolean;
}
type UserModel = Model<UserSchema, Document, userMethods>;
// --- 业务
const userSchema = new Schema<UserSchema, UserModel, userMethods>(
  {
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    name: {
      type: String,
    },
    avatar: {
      type: String,
    },
    role: {
      type: Number,
      enum: Object.values(TypeUserRoleEnum).filter(
        (key) => typeof key === "number" && !Number.isNaN(key)
      ),
      default: TypeUserRoleEnum.user,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);
// 保存到数据库之前，做一些处理
userSchema.pre("save", function (next) {
  try {
    this.password = crypto
      .createHash("md5")
      .update(this.password)
      .digest("hex");
    next();
  } catch (err: any) {
    next(err);
  }
});
// 保存到数据库之后，做一些处理
userSchema.post("save", function () {
  console.log("user saved: ", this);
});
userSchema.method("isValidatedPwd", function (pwd: string) {
  const encryptPwd = crypto.createHash("md5").update(pwd).digest("hex");
  return encryptPwd == this.password;
});
const userModel = mongoose.model<UserSchema, UserModel>("user", userSchema);
// ---- 导出对象
const validateUserSchema = Joi.object({
  email: Joi.string()
    .email({
      minDomainSegments: 2,
      tlds: { allow: ["com", "net", "top", "org", "io"] },
    })
    .required(),
  password: Joi.string().min(5).max(32).required(),
});
const validateUpdateUserSchema = Joi.object({
  password: Joi.string().min(5).max(32).required(),
  name: Joi.string().min(5).max(256),
});
export { validateUserSchema, validateUpdateUserSchema, TypeUserRoleEnum };
export default userModel;
