import mongoose, { Schema } from "mongoose";
import Joi from "joi";
const LinkSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    description: String,
    icon: String,
  },
  {
    timestamps: true,
  }
);
const LinkModel = mongoose.model("link", LinkSchema);
const validateLinkSchema = Joi.object({
  title: Joi.string().required().min(1).max(128),
  url: Joi.string().required().min(1),
  desc: Joi.string(),
  icon: Joi.string(),
});
export { validateLinkSchema };
export default LinkModel;
