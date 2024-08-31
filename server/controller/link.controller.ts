import HttpErrors from "http-errors";
import { Request, Response, NextFunction } from "express";
import LinkModel, { validateLinkSchema } from "../model/LinkModel";
import { pagenationValidateSchema } from "../utils/validate";
class LinkController {
  index() {
    throw HttpErrors.NotImplemented();
  }
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const validateResult = validateLinkSchema.validate(req.body);
      if (validateResult.error) {
        throw HttpErrors.BadRequest(validateResult.error.message);
      }
      // 不做去重
      const ret = await LinkModel.create(req.body);
      if (!ret) {
        console.log("新增link失败");
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
      const validateResult = validateLinkSchema.validate(req.body);
      if (validateResult.error) {
        throw HttpErrors.BadRequest(validateResult.error.message);
      }
      const linkId = req.params.linkId;
      const ret = await LinkModel.findByIdAndUpdate(linkId, req.body);
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
      const linkId = req.params.linkId;
      const ret = await LinkModel.findById(linkId);
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
      const ret = await LinkModel.findByIdAndDelete(req.params.linkId);
      if (!ret) {
        HttpErrors.NotFound("link不存在");
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
        mongoQuery = LinkModel.find({
          $or: [
            { title: { $regex: new RegExp(qstr, "i") } }, // 'i' 表示不区分大小写
            { description: { $regex: new RegExp(qstr, "i") } },
          ],
        });
      } else {
        mongoQuery = LinkModel.find({});
      }
      if (sortByCreateAt) {
        mongoQuery = mongoQuery.sort({
          createdAt: sortByCreateAt == "desc" ? -1 : 1,
        });
      }
      mongoQuery = mongoQuery.limit(pageSize).skip(pageSize * (page - 1));
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
export default new LinkController();
