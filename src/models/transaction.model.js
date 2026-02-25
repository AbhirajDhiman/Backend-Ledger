const mongoose=require('mongoose');
const MimeNode = require('nodemailer/lib/mime-node');
const transactionSchema=new mongoose.Schema({
    fromaccount:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Account',
        required:[true,'fromaccount is required'],
        index:true,

    },
    toaccount:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Account',
        required:[true,'toaccount is required'],
        index:true,
    },
    status:{
        type:String,

        enum:{
            values:['PENDING','COMPLETED','FAILED','REVERSED'], 
            message:'Status can either be PENDING, COMPLETED, FAILED or REVERSED'
        },
        default:'PENDING',
    },
    amount:{
        type:Number,
        required:[true,'amount is required for creating a transaction'],
        min:[0,'Transaction amount cannot be negative'] 
    },
    idempotencyKey:{
        type:String,
        required:[true,'idempotencyKey is required for creating a transaction'],
    },
},
    {
        timestamps:true
    }
)
const transactionModel=mongoose.model('Transaction',transactionSchema);
module.exports=transactionModel;