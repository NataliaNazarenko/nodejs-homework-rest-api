const {Schema, model} = require('mongoose');
const Joi = require('joi');
const {handleMongooseError} = require('../helpers')

const emailRegexp = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;


const userSchema = new Schema(
    {
        password: {
          type: String,
          required: [true, 'Set password for user'],
          
        },
        email: {
          type: String,
          required: [true, 'Email is required'],
          unique: true,
          match: emailRegexp,
        },
        subscription: {
          type: String,
          enum: ["starter", "pro", "business"],
          default: "starter",
        },
        token: {
        type: String,
        default: '',
        },
        avatarURL: {
          type: String,
          required: true,
        },

}, {versionKey: false, timestamps: true});

const registerSchema = Joi.object({
  password: Joi.string().required(),
  email: Joi.string().pattern(emailRegexp).required(),
  
});

const loginSchema = Joi.object({
    password: Joi.string().required(),
    email: Joi.string().pattern(emailRegexp).required(),
});

const subscriptionSchema = Joi.object({
  subscription: Joi.string().valid('starter', 'pro', 'business').required(),
});

const schemas = {
    registerSchema,
    loginSchema,
    subscriptionSchema,
  
}


const User = model('user', userSchema);

userSchema.post('save', handleMongooseError);


module.exports = {
  User,
  schemas,
}