const {Schema, model} = require('mongoose');
const Joi = require('joi');
const {handleMongooseError} = require('../helpers')

const emailRegexp = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const passwordRegexp = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

const userSchema = new Schema(
    {
        password: {
          type: String,
          required: [true, 'Set password for user'],
          match: passwordRegexp,
          minlength: 8,
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
          default: "starter"
        },
        token: String
}, {versionKey: false, timestamps: true});

const registerSchema = Joi.object({
  password: Joi.string().pattern(passwordRegexp).min(8).required(),
  email: Joi.string().pattern(emailRegexp).required(),
  
});

const loginSchema = Joi.object({
    password: Joi.string().pattern(passwordRegexp).min(8).required(),
    email: Joi.string().pattern(emailRegexp).required(),
    token: Joi.string(),
});

const schemas = {
    registerSchema,
    loginSchema,
  
}


const User = model('user', userSchema);

userSchema.post('save', handleMongooseError);


module.exports = {
    User,
  schemas,
}