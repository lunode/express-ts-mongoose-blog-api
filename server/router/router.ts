import { Router } from "express";
import authMiddleware, { TypeUserRoleEnum } from "../middleware/auth";
import userController from "../controller/user.controller";
import tagController from "../controller/tag.controller";
import messageController from "../controller/message.controller";
import linkController from "../controller/link.controller";
import postController from "../controller/post.controller";
import commentController from "../controller/comment.controller";
import createRateLimit from "../middleware/rateLimit";
const userRouter = Router();
const auth = authMiddleware();
const adminAuth = authMiddleware({ role: TypeUserRoleEnum.admin });
userRouter.get("/", auth, userController.index);
userRouter.post(
  "/register",
  createRateLimit({
    windowMs: 60, // 1分钟
    limit: 3, // 限制3次
    key: "register",
  }),
  userController.register
);
userRouter.post(
  "/login",
  createRateLimit({
    windowMs: 3600, // 一个小时
    limit: 10, // 限制3次
    key: "login", // key要全局唯一
  }),
  userController.login
);
userRouter.post("/updateuserinfo", auth, userController.updateUserInfo);
// 退出登录
userRouter.post("/signout", auth, userController.signout);
// 注销账号
userRouter.post("/logout", auth, userController.logout);
userRouter.post("/list", adminAuth, userController.userlist);
userRouter.post("/refresh_token", userController.refreshToken);

// userRouter.get("/oauth2/github/clientId", userController.githubOAuthClientId);
// userRouter.get("/oauth2/github", userController.githubOAuth);
const tagRouter = Router();
tagRouter.post("/", tagController.create);
tagRouter.patch("/:tagId", tagController.update);
tagRouter.get("/:tagId", tagController.find);
tagRouter.delete("/:tagId", tagController.delete);
tagRouter.post("/list", tagController.list);

const LinkRouter = Router();
LinkRouter.post("/", linkController.create);
LinkRouter.patch("/:linkId", linkController.update);
LinkRouter.get("/:linkId", linkController.find);
LinkRouter.delete("/:linkId", linkController.delete);
LinkRouter.post("/list", linkController.list);

const msgRouter = Router();
msgRouter.post("/", auth, messageController.create);
msgRouter.get("/:id", adminAuth, messageController.find);
msgRouter.delete("/:id", adminAuth, messageController.delete);
msgRouter.post("/list", adminAuth, messageController.list);

const postRouter = Router();
postRouter.post("/", adminAuth, postController.create);
postRouter.patch("/:id", adminAuth, postController.update);
postRouter.delete("/:id", adminAuth, postController.delete);
// 管理员查询的post列表多一些关键字段, 需要鉴权拿到用户
postRouter.post("/list/admin", adminAuth, postController.list);
postRouter.get("/:id", postController.find);
postRouter.post("/list", postController.list);
postRouter.post("/list", postController.list);

const commentRouter = Router();
// 管理后台操作
commentRouter.post("/list", adminAuth, commentController.list);
// 用户评论接口
commentRouter.delete("/:id", auth, commentController.delete);
commentRouter.post("/", auth, commentController.create);
commentRouter.post("/:postId/comments", commentController.postComments);

// ----router 路径前缀 => /api/vi---
const router = Router();
// 服务器运行时间
router.get("/runtime", (_, res) => {
  res.send({ message: "ok", success: true, data: process.uptime() });
});
router.use("/user", userRouter);
router.use("/tag", adminAuth, tagRouter);
router.use("/link", adminAuth, LinkRouter);
router.use("/message", msgRouter);
router.use("/post", postRouter);
router.use("/comment", commentRouter);
export default router;
