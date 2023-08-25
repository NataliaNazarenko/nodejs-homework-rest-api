const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const gravatar = require('gravatar');
require('dotenv').config();
const path = require('path');
const fs = require('fs/promises');
const jimp = require('jimp');
const { User } = require('../models/user');
const { ctrlWrapper, HttpError } = require('../helpers');
const { SECRET_KEY } = process.env;

const avatarsDir = path.join(__dirname, '../', 'public', 'avatars');

const register = async (req, res) => {

    const {email, password} = req.body;
    const user = await User.findOne({email});

    if(user){
        throw HttpError (409, "Email already in use")
    }

    const hashPassword = await bcrypt.hash(password, 10);
    const avatarURL = gravatar.url(email);
    
    const newUser = await User.create({
        ...req.body,
        password: hashPassword,
        avatarURL,
    });

    res.status(201).json({
        email: newUser.email,
        subscription: newUser.subscription,
    })

}

const login = async (req, res) => {

    const {email, password} = req.body;
    const user = await User.findOne({email});

    if(!user){
        throw HttpError (401, "Email or password invalid")
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
    login: ctrlWrapper(login),
    getCurrent: ctrlWrapper(getCurrent),
    logout: ctrlWrapper(logout),
    updateSubscription: ctrlWrapper(updateSubscription),
    updateAvatar: ctrlWrapper(updateAvatar),
};