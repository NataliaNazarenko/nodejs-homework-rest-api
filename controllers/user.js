const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const gravatar = require('gravatar');
require('dotenv').config();
const path = require('path');
const fs = require('fs/promises');
const jimp = require('jimp');
const { nanoid } = require('nanoid');
const { User } = require('../models/user');
const { ctrlWrapper, HttpError, sendEmail } = require('../helpers');
const { SECRET_KEY, BASE_URL } = process.env;

const avatarsDir = path.join(__dirname, '../', 'public', 'avatars');

const register = async (req, res) => {

    const {email, password} = req.body;
    const user = await User.findOne({email});

    if(user){
        throw HttpError (409, "Email already in use")
    }

    const hashPassword = await bcrypt.hash(password, 10);
    const avatarURL = gravatar.url(email);
    const verificationToken = nanoid();
        
    const newUser = await User.create({
        ...req.body,
        password: hashPassword,
        avatarURL,
        verificationToken
    });

    const verifyEmail = {
        to: email,
        subject: 'Verify Email',
        html: `<a target="_blank" href="${BASE_URL}/api/users/verify/${verificationToken}">Click verify email</a>`,
    };

    await sendEmail(verifyEmail);
    // await sendEmailNodemailer(verifyEmail);

    res.status(201).json({
        email: newUser.email,
        subscription: newUser.subscription,
    })

}

const verifyEmail = async (req, res) => {
    const { verificationToken } = req.params;
    const user = await User.findOne({ verificationToken });
    if (!user) {
      throw HttpError(404, 'User not found');
    }
    await User.findByIdAndUpdate(user._id, { verify: true, verificationToken: "" });
  
    res.json({
      message: 'Verification successful',
    });
  };

const resendVerifyEmail = async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      throw HttpError(401, 'Email not found');
    }
    if (user.verify) {
      throw HttpError(400, 'Verification has already been passed');
    }
  
    const verifyEmail = {
        to: email,
        subject: 'Verify Email',
        html: `<a target="_blank" href="${BASE_URL}/api/users/verify/${user.verificationToken}">Click verify email</a>`,
    };
  
    await sendEmail(verifyEmail);
  
    res.json({
      message: 'Verification email sent',
    });
  };

const login = async (req, res) => {

    const {email, password} = req.body;
    const user = await User.findOne({email});

    if(!user){
        throw HttpError (401, "Email or password invalid")
    }

    if(!user.verify){
        throw HttpError(401, "Email not verified")
    }

    const passwordCompare = await bcrypt.compare(password, user.password);

    if(!passwordCompare){
        throw HttpError (401, "Email or password invalid")
    }

    const payload = {
        id: user._id,
    }

    const token = jwt.sign(payload, SECRET_KEY, {expiresIn: "23h"});
    await User.findByIdAndUpdate(user._id, {token});

    res.json({
        token,
    })

}

const getCurrent = async (req, res) => {
    const {email} = req.user;

    res.json({
        email,
    })
}

const logout = async (req, res) => {
    const {_id} = req.user;
    const user = await User.findById(_id);

    if (!user) {
        return res.status(401).json({ message: 'Not authorized' });
    }

    await User.findByIdAndUpdate(_id, {token: ''});
   
    res.json({
        message: 'Logout success'
    })

};

const updateSubscription = async (req, res) => {
    const { _id } = req.user;
    const { subscription } = req.body;
      
    await User.findByIdAndUpdate(_id, { subscription });
    res.status(200).json({ subscription });
   
};

const updateAvatar = async (req, res) => {
    const { _id } = req.user;
    const { path: tempUpload, originalname } = req.file;
    const filename = `${_id}_${originalname}`;
    const resultUpload = path.join(avatarsDir, filename);

    // Завантаження аватарки в папку tmp
    await fs.rename(tempUpload, resultUpload);

    // Обробка аватарки за допомогою бібліотеки jimp
    const avatar = await jimp.read(resultUpload);
    await avatar.resize(250, 250);
    await avatar.writeAsync(resultUpload);

    // Генерація унікального імені файлу
    const uniqueFileName = `${_id}_${Date.now()}.${originalname.split('.').pop()}`;
    const avatarURL = path.join('avatars', uniqueFileName);

    // Переміщення обробленої аватарки в папку public/avatars
    const newAvatarPath = path.join(avatarsDir, uniqueFileName);
    await fs.rename(resultUpload, newAvatarPath);

    // Оновлення URL аватарки в базі даних
    await User.findByIdAndUpdate(_id, { avatarURL });

    res.json({
        avatarURL,
    });

}

module.exports = {
    register: ctrlWrapper(register),
    verifyEmail: ctrlWrapper(verifyEmail),
    resendVerifyEmail: ctrlWrapper(resendVerifyEmail),
    login: ctrlWrapper(login),
    getCurrent: ctrlWrapper(getCurrent),
    logout: ctrlWrapper(logout),
    updateSubscription: ctrlWrapper(updateSubscription),
    updateAvatar: ctrlWrapper(updateAvatar),
};