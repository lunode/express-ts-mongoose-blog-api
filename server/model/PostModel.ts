import mongoose, { Schema } from "mongoose";
import Joi from "joi";
const PostSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    converImg: String,
    tagList: [
      {
        type: Schema.Types.ObjectId,
        ref: "tag",
      },
    ],
    show: {
      type: Boolean,
      // 如果带有管理后台界面, default最好设为false, 需要博主手动切换状态进行发布
      default: true,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);
const PostModel = mongoose.model("post", PostSchema);
const validatePostSchema = Joi.object({
  title: Joi.string().required().min(1).max(128),
  content: Joi.string().required().min(1),
  converImg: Joi.string(),
  tagList: Joi.array().items(Joi.string().min(1).required()),
});
export { validatePostSchema };
export default PostModel;
