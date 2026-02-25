console.log('account.routes.js loaded');
const express=require('express');
const authMiddleware=require('../middleware/auth.middleware');
const router=express.Router();
const accountController=require('../controllers/account.controller');


//Post /api/accounts/
// Create a new account
// Protected route, requires authentication
router.post('/',authMiddleware,accountController.createAccountController);

module.exports=router;