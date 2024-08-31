import HttpErrors from "http-errors";
import { Request, Response, NextFunction } from "express";
import { isValidObjectId } from "mongoose";
import PostModel, { validatePostSchema } from "../model/PostModel";
import userModel, { TypeUserRoleEnum } from "../model/UserModel";
import { AuthRequest } from "../express";
import { pagenationValidateSchema } from "../utils/validate";
class PostController {
  index() {
    throw HttpErrors.NotImplemented();
  }
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const validateResult = validatePostSchema.validate(req.body);
      if (validateResult.error) {
        throw HttpErrors.BadRequest(validateResult.error.message);
      }
      const ret = await PostModel.create(req.body);
      if (!ret) {
        console.log("新增Post失败");
        throw HttpErrors.InternalServerError();
      }
      res.send({
        message: "ok",
        success: true,
        data: ret,
      });
    } catch (error) {
      next(error);
    }
  }
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const validateResult = validatePostSchema.validate(req.body);
      if (validateResult.error) {
        throw HttpErrors.BadRequest(validateResult.error.message);
      }
      const id = req.params.id;
      const ret = await PostModel.findByIdAndUpdate(id, req.body);
      if (!ret) {
        throw HttpErrors.NotFound();
      }
      res.send({
        message: "ok",
        success: true,
        data: ret,
      });
    } catch (error) {
      next(error);
    }
  }
  async find(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id;
      const ret = await PostModel.findById(id).populate("tagList", {
        name: 1,
        icon: 1,
      });
      if (!ret) {
        throw HttpErrors.NotFound();
      }
      res.send({
        message: "ok",
        success: true,
        data: ret,
      });
    } catch (error) {
      next(error);
    }
  }
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id;
      const ret = await PostModel.findByIdAndDelete(id);
      if (!ret) {
        throw HttpErrors.NotFound("");
      }
      res.send({
        message: "ok",
        success: true,
        data: ret,
      });
    } catch (error) {
      next(error);
    }
  }
  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const validateResult = pagenationValidateSchema.validate(req.body);
      if (validateResult.error) {
        console.log(validateResult.error);
        throw HttpErrors.UnprocessableEntity(validateResult.error.message);
      }
      const tag = req.query.tag;
      if (!isValidObjectId(req.query.tag)) {
        throw HttpErrors.BadRequest("tagId非法");
      }
      const { pageSize = 10, page = 1, query, sortByCreateAt } = req.body;
      let mongoQuery;
      if (query) {
        mongoQuery = PostModel.find({
          $or: [
            { title: { $regex: new RegExp(query, "i") } }, // 'i' 表示不区分大小写
            { content: { $regex: new RegExp(query, "i") } },
          ],
        });
      } else {
        mongoQuery = PostModel.find({});
      }
      if (tag) {
        mongoQuery.where("tagList").in([tag]);
      }
      if (sortByCreateAt) {
        mongoQuery = mongoQuery.sort({
          createdAt: sortByCreateAt == "desc" ? -1 : 1,
        });
      }
      mongoQuery = mongoQuery
        .populate("tagList", {
          name: 1,
          icon: 1,
        })
        .limit(pageSize)
        .skip(pageSize * (page - 1));
      const user = await userModel.findById(req.payload?.aud).select("+role");
      //
      if (!user) {
        /* 公共接口, 不存在user不不做任何处理 */
      }
      if (user && user.role === TypeUserRoleEnum.admin) {
        mongoQuery = mongoQuery.select("+show");
      }
      const linkList = await mongoQuery.exec();
      const totalCount = await mongoQuery.clone().lean().countDocuments();
      res.send({
        message: "ok",
        success: true,
        data: {
          page,
          pageSize,
          linkList,
          totalCount,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
export default new PostController();
