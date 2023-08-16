const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/user')
const {validateBody} = require('../../middlewares')
const {schemas} = require('../../models/user')

router.post('/register', validateBody(schemas.registerSchema), ctrl.register)


module.exports = router;
