const userModel=require('../models/user.model');
const jwt=require('jsonwebtoken');
const tokenBlacklistModel=require('../models/tokenBlacklist.model');

async function authMiddleware(req,res,next){
    const token = req.cookies.token || req.headers['authorization']?.split(' ')[1];

    if(!token){
        return res.status(401).json({message:'Unauthorized: No token provided'});
    }
    const isblacklisted=await tokenBlacklistModel.findOne({token:token});
    if(isblacklisted){
        return res.status(401).json({message:'Unauthorized: Token is blacklisted'});
    }
    try{
        const decoded=jwt.verify(token,process.env.JWT_SECRET_KEY);
        const user=await userModel.findById(decoded.id).select('-password');

        if(!user){
            return res.status(401).json({message:'Unauthorized: User not found'});
        }
        req.user=user;
        next();
    }catch(error){
        return res.status(401).json({message:'Unauthorized: Invalid token'});
    }
}

async function authSystemUserMiddleware(req,res,next){
    const token = req.cookies.token || req.headers['authorization']?.split(' ')[1];
    if(!token){
        return res.status(401).json({message:'Unauthorized: No token provided'});
    }

    const isblacklisted=await tokenBlacklistModel.findOne({token:token});
    if(isblacklisted){
        return res.status(401).json({message:'Unauthorized: Token is blacklisted'});
    }

    try{
        const decoded=jwt.verify(token,process.env.JWT_SECRET_KEY);
        const user=await userModel.findById(decoded.id).select('+systemuser');
        if(!user){
            return res.status(401).json({message:'Unauthorized: User not found'});
        }
        if(!user.systemuser){
            return res.status(401).json({message:'Unauthorized: User is not a system user'});
        }
        req.user=user;
        next();
    }catch(error){
        return res.status(401).json({message:'Unauthorized: Invalid token'});
    }
}

module.exports={
    authMiddleware,
    authSystemUserMiddleware
};