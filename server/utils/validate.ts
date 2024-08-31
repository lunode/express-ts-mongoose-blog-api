import Joi from "joi";
const pagenationValidateSchema = Joi.object({
  pageSize: Joi.number().min(1).max(100).required(),
  page: Joi.number().min(1).required(),
  sortByCreateAt: Joi.string().valid("asc", "desc").allow(null),
  query: Joi.string(),
});

export { pagenationValidateSchema };
