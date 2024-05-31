import HttpErrors from "http-errors";
import { Request, Response, NextFunction } from "express";
import TagModel, { validateTagSchema } from "../model/TagModel";
// import { AuthRequest } from "../express";
import { pagenationValidateSchema } from "../utils/validate";
class TagController {
  index() {
    throw HttpErrors.NotImplemented();
  }
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const validateResult = validateTagSchema.validate(req.body);
      if (validateResult.error) {
        throw HttpErrors.BadRequest(validateResult.error.message);
      }
      const { name, icon } = req.body;
      const tag = await TagModel.findOne({ name });
      if (tag) {
        throw HttpErrors.Conflict("Tag已存在");
      }
      const ret = await TagModel.create({ name, icon });
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
      const validateResult = validateTagSchema.validate(req.body);
      if (validateResult.error) {
        throw HttpErrors.BadRequest(validateResult.error.message);
      }
      const tagId = req.params.tagId;
      const { name, icon } = req.body;
      const ret = await TagModel.findByIdAndUpdate(tagId, { name, icon });

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
      const tagId = req.params.tagId;
      const ret = await TagModel.findById(tagId);
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
      // TODO
      throw HttpErrors.NotImplemented();
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
        mongoQuery = TagModel.find({ name: { $regex: new RegExp(qstr, "i") } });
      } else {
        mongoQuery = TagModel.find({});
      }
      if (sortByCreateAt) {
        mongoQuery = mongoQuery.sort({
          createdAt: sortByCreateAt == "desc" ? -1 : 1,
        });
      }
      mongoQuery = mongoQuery.limit(pageSize).skip(pageSize * (page - 1));
      const tagList = await mongoQuery.exec();
      const totalCount = await mongoQuery.clone().lean().countDocuments();
      res.send({
        message: "ok",
        success: true,
        data: {
          page,
          pageSize,
          tagList,
          totalCount,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
export default new TagController();
