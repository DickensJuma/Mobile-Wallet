
const express = require('express');
const router = express.Router();
const  userService = require('../services/user');

router.post('/signup', userService.signup);
router.post('/signin', userService.signin);
router.post('/verify', userService.verifyEmail);
router.post('/reset-password', userService.resetPassword);
router.post('/forgot-password', userService.forgotPassword);
router.post('/resend-verification-email', userService.resendVerificationEmail);
router.get('/dashboard/getwalletinfo', userService.getWalletInfo);


module.exports = router