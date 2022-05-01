import Joi from "joi";

const messageSchema = Joi.object({
  from: Joi.string().required(),
  to: Joi.string().required(),
  text: Joi.string().required(),
  type: Joi.string().pattern(new RegExp("^(private_)?message$")).required(),
});

const participantSchema = Joi.string().required();

const options = {
  abortEarly: false,
};

export { messageSchema, participantSchema, options };
