//  用户登录注册登录样例
import { Request, Response, NextFunction } from "express";
import UserModel, {
  validateUserSchema,
  validateUpdateUserSchema,
  TypeUserRoleEnum,
} from "../model/UserModel";
import { pagenationValidateSchema } from "../utils/validate";
import { AuthRequest } from "../express";
import HttpErrors from "http-errors";
import {
  removeRTokenFromRedis,
  removeATokenFromRedis,
} from "../database/redis";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../utils/token";
import { UnAuthError } from "../error";
// import config from "../config/config";
import cyrpto from "node:crypto";
class UserController {
  index() {
    throw HttpErrors.NotImplemented();
  }
  /**
   * @description 用户注册
   */
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = validateUserSchema.validate(req.body);
      if (result.error) {
        throw HttpErrors.UnprocessableEntity(result.error.toString());
      }
      const { email, password } = req.body;
      // 判断邮箱是否注册
      const user = await UserModel.findOne({ email: email });
      if (user) {
        // 对ip进行访问限制, 此操作在 rate-limit中间件处理
        throw HttpErrors.Conflict("该邮箱已经注册");
      }
      // 判断是不是第一个注册用户, 第一个注册用户是管理员
      const userCount = await UserModel.countDocuments();
      const role =
        userCount > 0 ? TypeUserRoleEnum.user : TypeUserRoleEnum.admin;
      const emailSha256 = cyrpto
        .createHash("sha256")
        .update(email)
        .digest("hex");
      console.log("emailSha256:", emailSha256);
      const avatar = `https://gravatar.com/avatar/${emailSha256}.jpg`;
      const newUser = new UserModel({ email, password, role, avatar });
      const ret = await newUser.save().then((user) => {
        return {
          email: user.email,
          avatar: user.avatar,
          isAdmin: user.role == TypeUserRoleEnum.admin,
          _id: user._id,
        };
      });
      res.send({
        success: true,
        message: "注册成功",
        data: {
          access_token: await signAccessToken(ret._id.toString()),
          refresh_token: await signRefreshToken(ret._id.toString()),
          user: ret,
        },
      });
    } catch (err) {
      console.log(err);
      next(err);
    }
  }
  /**
   * @description 用户登录
   */
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = validateUserSchema.validate(req.body);
      if (result.error) {
        throw HttpErrors.UnprocessableEntity(result.error.toString());
      }
      const { email, password } = req.body;
      const user = await UserModel.findOne({ email }).select("+password");
      if (!user) {
        throw HttpErrors.NotFound("用户未注册");
      }
      const pwdValid: boolean = user.isValidatedPwd(password);
      if (!pwdValid) {
        throw UnAuthError.wrongPassword();
      }
      res.send({
        success: true,
        message: "登陆成功",
        data: {
          access_token: await signAccessToken(user.id),
          // 签名refresh_token的时候, 会覆写redis中的refresh_token
          refresh_token: await signRefreshToken(user.id),
          user: {
            email: user.email,
            _id: user._id.toString(),
            avatar: user.avatar,
            name: user.name,
            isAdmin: user.role == TypeUserRoleEnum.admin,
          },
        },
      });
    } catch (err) {
      console.log("Login Error:", err);
      next(err);
    }
  }
  /**
   * @description 退出登录
   * 退出登录要删除redis中用户的refreshtoken
   */
  async signout(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      // TODO: 改成 redis事务
      const [ret1, ret2] = await Promise.all([
        removeATokenFromRedis(req.payload?.aud as string),
        removeRTokenFromRedis(req.payload?.aud as string),
      ]);
      // 前有auth中间件, 则token必然存在, 删除结果必然为1, 不为1出大问题
      if (ret1 != 1 || ret2 != 1) {
        throw HttpErrors.InternalServerError();
      }
      res.send({
        message: "退出登录成功",
        success: true,
        data: {},
      });
    } catch (err) {
      next(err);
    }
  }
  // 注销
  async logout(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await UserModel.findById(req.payload?.aud).select("+role");
      if (!user) {
        throw HttpErrors.NotFound("用户不存在");
      }
      console.log("logout:", user);
      if (user.role == TypeUserRoleEnum.admin) {
        throw HttpErrors.Forbidden("管理员不能注销");
      }
      const ret = await user.deleteOne();
      if (ret.deletedCount === 0) {
        throw HttpErrors.NotFound("未找到用户");
      }
      res.send({
        message: "注销成功",
        data: ret,
        success: true,
      });
    } catch (err) {
      next(err);
    }
  }
  // TODO: /resetpassword , req.body: {password:"", oldpassword:""}
  async updateUserInfo(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const validateResult = validateUpdateUserSchema.validate(req.body);
      if (validateResult.error) {
        throw HttpErrors.UnprocessableEntity(validateResult.error.message);
      }
      const user = await UserModel.findById(req.payload?.aud).select("+role");
      if (!user) {
        throw HttpErrors.NotFound("用户不存在");
      }
      const { password, name } = req.body;
      user.password = password;
      if (name) {
        user.name = name;
      }
      const ret = await user.save().then((user) => {
        console.log("user.role:", user.role);
        return {
          _id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          isAdmin: user.role == TypeUserRoleEnum.admin,
        };
      });
      // 删除用户登录状态
      // TODO: 改成 redis事务
      const [ret1, ret2] = await Promise.all([
        removeATokenFromRedis(req.payload?.aud as string),
        removeRTokenFromRedis(req.payload?.aud as string),
      ]);
      // 前有auth中间件, 则token必然存在, 删除结果必然为1, 不为1出大问题
      if (ret1 != 1 || ret2 != 1) {
        throw HttpErrors.InternalServerError();
      }
      res.send({
        message: "修改成功",
        success: true,
        data: ret,
      });
    } catch (err) {
      next(err);
    }
  }
  // 前中间件做了adminAuth
  async userlist(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const validateResult = pagenationValidateSchema.validate(req.body);
      if (validateResult.error) {
        console.log(validateResult.error);
        throw HttpErrors.UnprocessableEntity(validateResult.error.message);
      }
      const { pageSize = 10, page = 1, query, sortByCreateAt } = req.body;
      const qstr = req.body.query;
      let mongoQuery;
      if (query) {
        mongoQuery = UserModel.find({
          $or: [
            { name: { $regex: new RegExp(qstr, "i") } }, // 'i' 表示不区分大小写
            { email: { $regex: new RegExp(qstr, "i") } },
          ],
        });
      } else {
        mongoQuery = UserModel.find();
      }
      if (sortByCreateAt) {
        mongoQuery = mongoQuery.sort({
          createdAt: sortByCreateAt == "desc" ? -1 : 1,
        });
      }
      mongoQuery = mongoQuery
        .limit(pageSize)
        .skip(pageSize * (page - 1))
        .select("+role +createdAt");

      const userList = await mongoQuery.exec().then((userList) =>
        userList.map((user) => ({
          _id: user.id,
          avatar: user.avatar,
          email: user.email,
          isAdmin: user.role == TypeUserRoleEnum.admin,
          createdAt: user.createdAt,
        }))
      );
      const totalCount = await mongoQuery.clone().lean().countDocuments();
      res.send({
        message: "ok",
        success: true,
        data: {
          page,
          pageSize,
          userList,
          totalCount,
        },
      });
    } catch (error) {
      next(error);
    }
  }
  async refreshToken(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return HttpErrors.BadRequest();
      }
      const payload = await verifyRefreshToken(refreshToken);
      res.send({
        message: "ok",
        success: true,
        data: {
          access_token: await signAccessToken(payload.aud as string),
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new UserController();
