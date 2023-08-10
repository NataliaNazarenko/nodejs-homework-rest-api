const {Schema, model} = require('mongoose');
const Joi = require('joi');
const {handleMongooseError} = require('../helpers')

const emailRegexp = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const phoneRegexp = /^\([0-9]{3}\) [0-9]{3}-[0-9]{4}$/;

const contactSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Set name for contact"],
    },
    email: {
      type: String,
      required: [true, "Email required"],
      match: emailRegexp,
    },
    phone: {
      type: String,
      required: [true, "Phone required"],
      match: phoneRegexp,
    },
    favorite: {
      type: Boolean,
      default: false,
    },
  }, {versionKey: false, timestamps: true});

const addSchema = Joi.object({
  name: Joi.string().required(),

  email: Joi.string().pattern(emailRegexp).required(),

  phone: Joi.string().pattern(phoneRegexp).required(),

  favorite: Joi.boolean(),
});

const updateFavoriteSchemas = Joi.object({
  favorite: Joi.boolean().required(),
});

const schemas = {
  addSchema,
  updateFavoriteSchemas,
}


const Contact = model('contact', contactSchema);

contactSchema.post('save', handleMongooseError);

module.exports = {
  Contact,
  schemas,
}