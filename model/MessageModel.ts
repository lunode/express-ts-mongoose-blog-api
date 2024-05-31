import mongoose, { Schema } from "mongoose";
import Joi from "joi";
const MessageSchema = new Schema(
  {
    uid: {
      type: Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    // 邮件发送成功后绘制
    messageId: {
      type: String,
    },
    receipt: String,
  },
  {
    timestamps: true,
  }
);
const MessageModel = mongoose.model("message", MessageSchema);
const messageValidateSchema = Joi.object({
  message: Joi.string().required().min(1).max(500),
  // uid: Joi.string().required(),
});
export { messageValidateSchema };
export default MessageModel;
