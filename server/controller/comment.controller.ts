import HttpErrors from "http-errors";
import { Types } from "mongoose";
import { Response, NextFunction } from "express";
import { AuthRequest } from "../express";
import CommentModel, { validateCommentSchema } from "../model/CommentModel";
import PostModel from "../model/PostModel";
import userModel, { TypeUserRoleEnum } from "../model/UserModel";
import { pagenationValidateSchema } from "../utils/validate";
class CommentController {
  index() {
    throw HttpErrors.NotImplemented();
  }
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const validatedResult = validateCommentSchema.validate(req.body);
      if (validatedResult.error) {
        throw HttpErrors.BadRequest(validatedResult.error.message);
      }
      const { postId, content, parentCommentId = null } = req.body;
      // 评论的逻辑判断
      const post = await PostModel.findById(postId).select("+show");
      if (!post || !post.show) {
        throw HttpErrors.NotFound();
      }
      // 如果有父评论, 还需要验证父评论是否存在
      if (parentCommentId) {
        const parentComment = await CommentModel.findById(parentCommentId);
        if (!parentComment) {
          throw HttpErrors.NotFound("评论的对象不存在");
        }
        if (parentComment.postId.toString() !== postId) {
          throw HttpErrors.Forbidden();
        }
      }
      const ret = await CommentModel.create({
        postId,
        content,
        parentCommentId,
        uid: req.payload?.aud,
      });
      if (!ret) {
        console.log("评论失败");
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
  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id;
      const comment = await CommentModel.findById(id);
      if (!comment) {
        throw HttpErrors.NotFound();
      }
      const user = await userModel.findById(req.payload?.aud).select("+role");
      // 注销用户过不了auth, 走不了这块, 这个if只是应对 ts类型
      if (!user) {
        console.log("删除评论, 查询用户不存在");
        throw HttpErrors.Unauthorized();
      }
      const isAdmin = user.role === TypeUserRoleEnum.admin;
      if (!isAdmin && comment.uid != user._id) {
        throw HttpErrors.Forbidden();
      }
      let delChildCommentCount = 0;
      // 删除子评论
      if (!comment.parentCommentId) {
        const ret = await CommentModel.deleteMany({
          parentCommentId: comment.id,
        });
        delChildCommentCount = ret.deletedCount;
        console.log("删除:");
      }
      const ret = await comment.deleteOne();
      if (ret.deletedCount == 0) {
        throw HttpErrors.InternalServerError();
      }
      res.send({
        message: "ok",
        success: true,
        data: {
          delCommentCount: ret.deletedCount,
          delChildCommentCount: delChildCommentCount,
        },
      });
    } catch (error) {
      next(error);
    }
  }
  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const validatedResult = await pagenationValidateSchema.validate(req.body);
      if (validatedResult.error) {
        throw HttpErrors.BadRequest(validatedResult.error.message);
      }
      const { page = 1, pageSize = 10, query, sortByCreateAt } = req.body;
      let aggregatePipe: any[] = [
        {
          $lookup: {
            from: "users", // 用户集合
            localField: "uid",
            foreignField: "_id",
            as: "users",
          },
        },
        // 评论对应一个作者, 把user数组展开挂在user对象上
        {
          $addFields: {
            user: { $arrayElemAt: ["$users", 0] },
          },
        },
      ];
      if (query) {
        aggregatePipe.push({
          $match: {
            $or: [
              {
                content: { $regex: new RegExp(query, "i") },
              },
              {
                "users.email": { $regex: new RegExp(query, "i") },
              },
              {
                "users.name": { $regex: new RegExp(query, "i") },
              },
            ],
          },
        });
      }
      aggregatePipe = aggregatePipe.concat(
        {
          $limit: pageSize,
        },
        {
          $skip: (page - 1) * pageSize,
        },
        {
          $sort: {
            createdAt: sortByCreateAt == "desc" ? -1 : 1,
          },
        },
        {
          $lookup: {
            from: "posts", // post 表名
            localField: "postId",
            foreignField: "_id",
            as: "posts",
          },
        },
        {
          $addFields: {
            post: { $arrayElemAt: ["$posts", 0] },
          },
        },
        {
          $project: {
            content: 1,
            "user._id": 1,
            "user.name": 1,
            "user.email": 1,
            "post.title": 1,
            "post._id": 1,
          },
        }
      );
      const ret = await CommentModel.aggregate(aggregatePipe);
      console.log("ret:", ret);
      res.send({
        message: "ok",
        success: 0,
        data: ret,
      });
    } catch (error) {
      next(error);
    }
  }
  async postComments(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      // TODO: 相对复杂,性能太差,还是将子评论放入父评论的数组字段中比较简单
      const validatedResult = await pagenationValidateSchema.validate(req.body);
      if (validatedResult.error) {
        throw HttpErrors.BadRequest(validatedResult.error.message);
      }
      const postId = req.params.postId;
      const { page = 1, pageSize = 10, sortByCreateAt } = req.body;
      const aggregatePipe: any[] = [
        {
          $match: {
            parentCommentId: null,
            postId: new Types.ObjectId(postId),
          },
        },
        {
          $sort: {
            createdAt: sortByCreateAt == "desc" ? -1 : 1,
          },
        },
        {
          $limit: pageSize,
        },
        {
          $skip: (page - 1) * pageSize,
        },
        {
          $lookup: {
            from: "users", // 用户集合
            localField: "uid",
            foreignField: "_id",
            as: "users",
          },
        },
        // 评论对应一个作者, 把user数组展开挂在user对象上
        {
          $addFields: {
            user: { $arrayElemAt: ["$users", 0] },
          },
        },
        {
          $lookup: {
            from: "comments",
            localField: "_id",
            foreignField: "parentCommentId",
            as: "_childComments",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "_childComments.uid",
            foreignField: "_id",
            as: "childUser",
          },
        },
        {
          $addFields: {
            // 新childComponents
            childComments: {
              $map: {
                input: "$_childComments",
                as: "child",
                in: {
                  $mergeObjects: [
                    "$$child",
                    { user: { $arrayElemAt: ["$childUser", 0] } },
                  ],
                },
              },
            },
          },
        },

        {
          $project: {
            content: 1,
            "user._id": 1,
            "user.name": 1,
            "user.avatar": 1,
            parentCommentId: 1,
            childComments: {
              $map: {
                input: "$childComments",
                as: "child",
                in: {
                  _id: "$$child._id",
                  content: "$$child.content",
                  user: {
                    _id: "$$child.user._id",
                    name: "$$child.user.name",
                    avatar: "$$child.user.avatar",
                  },
                },
              },
            },
          },
        },
      ];
      const ret = await CommentModel.aggregate(aggregatePipe);
      console.log("ret:", ret);
      res.send({
        message: "ok",
        success: 0,
        data: ret,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new CommentController();
