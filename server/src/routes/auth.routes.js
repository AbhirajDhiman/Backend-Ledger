console.log("Auth routes loaded");
const express=require('express');
const authController=require('../controllers/auth.controller');

const router = express.Router();

/*Post route for user registration
POST /api/auth/register
*/
router.post('/register',authController.registerUser);

// POST /api/auth/login
router.post('/login',authController.LoginUserController);


router.post('/logout',authController.LogoutUserController);


module.exports=router;