import HttpErrors from "http-errors";
import { Request, Response, NextFunction } from "express";
import { AuthRequest } from "../express";
import MessageModel, { messageValidateSchema } from "../model/MessageModel";
import { pagenationValidateSchema } from "../utils/validate";
import userModel from "../model/UserModel";
import sendEmail from "../utils/sendEmail";
class MessageController {
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const validateResult = messageValidateSchema.validate(req.body);
      if (validateResult.error) {
        throw HttpErrors.BadRequest(validateResult.error.message);
      }
      const uid = req.payload?.aud;
      const user = await userModel.findById(uid);
      if (!user) {
        throw HttpErrors.Unauthorized();
      }
      const admin = await userModel.findOne({ role: 0 });
      if (!admin) {
        throw HttpErrors.NotFound("管理员不存在");
      }
      const message = await MessageModel.create({
        uid,
        message: req.body.message,
      });
      if (!message) {
        console.log("新增message插入数据库失败");
        throw HttpErrors.InternalServerError();
      }
      const ret = await sendEmail({
        username: user.name,
        userEmail: user.email,
        message: req.body.message,
        to: admin.email,
      });
      // 用户留言成功, 返回true
      // 发送邮件失败, 应该写入日志数据库, 而不是返回留言失败
      // TODO: 用户行为日志记录
      if (!ret) {
        console.log("发送邮件失败");
      } else {
        const ret2 = await MessageModel.findByIdAndUpdate(message.id, {
          messageId: ret.messageId,
          receipt: JSON.stringify(ret),
        });
        if (!ret2) {
          // 只做日志记录
          console.log("邮件发送成功, 更新邮件信息到Message表时失败");
        }
      }
      res.send({
        message: "ok",
        success: true,
        data: message.id,
      });
    } catch (error) {
      next(error);
    }
  }
  async find(req: Request, res: Response, next: NextFunction) {
    try {
      const msgId = req.params.id;
      const message = await MessageModel.findById(msgId);
      if (!message) {
        throw HttpErrors.NotFound();
      }
      res.send({
        message: "ok",
        success: true,
        data: message,
      });
    } catch (error) {
      next(error);
    }
  }
  async list(req: Request, res: Response, next: NextFunction) {
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
        mongoQuery = MessageModel.find({
          message: { $regex: new RegExp(qstr, "i") },
        });
      } else {
        mongoQuery = MessageModel.find({});
      }
      if (sortByCreateAt) {
        mongoQuery = mongoQuery.sort({
          createdAt: sortByCreateAt == "desc" ? -1 : 1,
        });
      }
      mongoQuery = mongoQuery
        .populate({
          path: "uid",
          model: "user",
          select: "-createdAt -updatedAt",
          options: {
            alias: "userinfo",
          },
        })
        .limit(pageSize)
        .skip(pageSize * (page - 1));
      const list = await mongoQuery.exec();
      const totalCount = await mongoQuery.clone().lean().countDocuments();
      res.send({
        message: "ok",
        success: true,
        data: {
          page,
          pageSize,
          messageList: list,
          totalCount,
        },
      });
    } catch (error) {
      next(error);
    }
  }
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const msgId = req.params.id;
      const ret = await MessageModel.findByIdAndDelete(msgId);
      if (!ret) {
        throw HttpErrors.NotFound();
      }
      return res.send({
        message: "ok",
        success: true,
        data: ret,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new MessageController();
