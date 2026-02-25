console.log('account.controller.js loaded');
const accountModel=require('../models/account.model');

// Create a middle for checking if user is loggedin or not
async function createAccountController(req,res){
    try {
        const user=req.user; // Assuming authMiddleware sets req.user
        const account=await accountModel.create({
            userId:user._id,
        });

        return res.status(201).json({
            message:'Account created successfully',
            account,
            status:'success'
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message || 'Something went wrong',
            status: 'failed'
        });
    }
}
module.exports={
    createAccountController
}