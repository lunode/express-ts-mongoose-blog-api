import mongoose, { Schema } from "mongoose";
import Joi from "joi";
const TagSchema = new Schema(
  {
    name: {
      type: String,
      require: true,
      unique: true,
    },
    icon: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);
const TagModel = mongoose.model("tag", TagSchema);
const validateTagSchema = Joi.object({
  name: Joi.string().required().min(1).max(128),
  icon: Joi.string(),
});
export { validateTagSchema };
export default TagModel;
