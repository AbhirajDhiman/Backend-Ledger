console.log('account.routes.js loaded');
const express=require('express');
const authMiddleware=require('../middleware/auth.middleware');
const router=express.Router();
const accountController=require('../controllers/account.controller');


//Post /api/accounts/
// Create a new account
// Protected route, requires authentication
router.post('/',authMiddleware.authMiddleware,accountController.createAccountController);

/*
* GET /api/accounts
*/
router.get('/',authMiddleware.authMiddleware,accountController.getuserAccountsController);

/*
* GET /api/accounts/balance/:accountId
*/
router.get('/balance/:accountId',authMiddleware.authMiddleware,accountController.getAccountBalanceController);
module.exports=router;