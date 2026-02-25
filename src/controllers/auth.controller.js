console.log('Auth controller loaded');
const userModel=require('../models/user.model');
const jwt=require('jsonwebtoken');
const emailService=require('../services/email.service');
const tokenBlacklistModel=require('../models/tokenBlacklist.model');
/**
 *User Registration controller
 *POST /api/auth/register
 */
async function registerUser(req,res){
    try {
        const {email,name,password}=req.body;

        if(!email || !name || !password){
            return res.status(400).json({message:'All fields are required'});
        }

        const normalizedEmail = email.toLowerCase().trim();
        const isExistingUser = await userModel.findOne({
            email: normalizedEmail
        });

        if(isExistingUser){
            return res.status(422).json({
                message:'Email already exists',
                status:'failed'
            });
        }

        const user = await userModel.create({
            email: normalizedEmail,
            name,
            password
        });

        const token=jwt.sign({id:user._id},process.env.JWT_SECRET_KEY,{
            expiresIn:'3d'
        });

        res.cookie('token',token, { httpOnly: true });

        emailService
            .sendRegistrationEmail(user.email, user.name)
            .catch((err) => console.error('Failed to send registration email:', err.message));

        return res.status(201).json({
            _id:user._id,
            email:user.email,
            name:user.name,
            status:'success',
            token
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message || 'Something went wrong',
            status: 'failed'
        });
    }
}

/*
 * User Login controller
 * POST /api/auth/login
 */

async function LoginUserController(req,res){
    try {
        const {email,password}=req.body;
        if(!email || !password){
            return res.status(400).json({message:'Email and password are required'});
        }

        const normalizedEmail = email.toLowerCase().trim();
        const user=await userModel.findOne({ email: normalizedEmail }).select('+password');

        if(!user){
            return res.status(401).json({message:'Invalid email or password'});
        }

        const isValidPassword=await user.comparePassword(password);
        if(!isValidPassword){
            return res.status(401).json({message:'Invalid email or password'});
        }

        const token=jwt.sign({id:user._id},process.env.JWT_SECRET_KEY,{
            expiresIn:'3d'
        });

        res.cookie('token',token, { httpOnly: true });

        return res.status(200).json({
            _id:user._id,
            email:user.email,
            name:user.name,
            status:'success',
            token
        });
    } catch (err) {
        return res.status(500).json({
            message: err.message || 'Something went wrong',
            status: 'failed'
        });
    }
}
/*
* User Logout controller
* POST /api/auth/logout
*/
async function LogoutUserController(req,res){
    try{
        const token=req.cookies.token || req.headers['authorization']?.split(' ')[1];
        if(!token){
            return res.status(400).json({message:'No token provided'});
        }

        await tokenBlacklistModel.create({
            token:token
        });

        res.clearCookie('token');
        return res.status(200).json({
            message:'Logged out successfully',
            status:'success'
        });
    }catch(error){
        return res.status(500).json({
            message:error.message || 'Something went wrong',
            status:'failed'
        });
    }
}
module.exports={
    registerUser,
    LoginUserController,
    LogoutUserController
}