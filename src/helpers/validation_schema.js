import Joi from "joi";

const messageSchema = Joi.object({
  to: Joi.string().required(),
  text: Joi.string().required(),
  type: Joi.string().pattern(new RegExp("^(private_)?message$")).required(),
});

const participantSchema = Joi.string().required();

export { messageSchema, participantSchema };
