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

async function getuserAccountsController(req,res){
    try{
        const user=req.user;
        const accounts=await accountModel.find({userId:user._id});
        res.status(200).json({
            accounts
        });
    }catch(error){
        return res.status(500).json({
            message: error.message || 'Something went wrong',
            status: 'failed'
        });
    }
}
async function getAccountBalanceController(req,res){
    const{accountId}=req.params;
    try{
        const account=await accountModel.findOne({
            _id:accountId,
            userId:req.user._id
        });
        if(!account){
            return res.status(404).json({
                message:'Account not found'
            });
        }
        const balance=await account.getBalance();
        return res.status(200).json({
            accountId,
            balance
        });
    }catch(error){
        return res.status(500).json({
            message: error.message || 'Something went wrong',
            status: 'failed'
        });
    }
}
module.exports={
    createAccountController,
    getuserAccountsController,
    getAccountBalanceController
}