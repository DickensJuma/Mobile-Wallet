
const express = require('express');
const router = express.Router();
const  walletService = require('../services/wallet');

router.get('/getwalletinfo', walletService.getWalletInfo);
router.post('/walletcredit', walletService.walletCredit);
router.post('/walletwithdraw', walletService.walletWithdraw);
router.post('/wallettransfer', walletService.walletTransfer);
router.post('/walletrequestreversal', walletService.walletRequestRevarsal);



module.exports = router