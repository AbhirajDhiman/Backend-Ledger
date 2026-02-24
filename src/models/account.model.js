const mongoose=require('mongoose');
const accountSchema=new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:[true,'User ID is required'],
        index:true //for faster lookups(searching)
    },
    accountType:{   
        type:String,
        enum:{values:['ACTIVE','FROZEN','CLOSED'],message:'Invalid account type'},
        required:[true,'Account type can be ACTIVE, FROZEN, or CLOSED'],
        default:'ACTIVE'
    },
    currency:{
        type:String,
        required:[true,'Currency is required'],
        default:'INR'
    },

},{
    timestamps:true
});
accountSchema.index({userId:1,accountType:1}); //for faster lookups(searching) using compound indexes
const accountModel=mongoose.model('Account',accountSchema);
module.exports=accountModel;    
