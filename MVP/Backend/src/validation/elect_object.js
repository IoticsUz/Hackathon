const Joi = require("joi")

module.exports.getQuery = Joi.object().keys({
    type: Joi.string().required(),
}).required()
