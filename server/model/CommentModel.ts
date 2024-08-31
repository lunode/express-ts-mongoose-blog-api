import mongoose, { Schema } from "mongoose";
import Joi from "joi";
const CommentSchema = new Schema(
  {
    content: {
      type: String,
      required: true,
    },
    postId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "post",
    },
    uid: {
      type: Schema.Types.ObjectId,
      require: true,
      ref: "user",
    },
    parentCommentId: {
      type: Schema.Types.ObjectId,
      ref: "comment",
    },
  },
  {
    timestamps: true,
  }
);
const CommentModel = mongoose.model("comment", CommentSchema);
const objectId = Joi.string().custom((v, helper) => {
  if (!mongoose.isValidObjectId(v)) {
    return helper.error("any.invalid", { message: "ObjectId格式非法" });
  }
  return v;
});
const validateCommentSchema = Joi.object({
  content: Joi.string().required().min(1).max(256),
  postId: objectId.required().min(1),
  parentCommentId: objectId,
});
export { validateCommentSchema };
export default CommentModel;
