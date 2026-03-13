const mongoose=require('mongoose');
const transactionModel=require('./transaction.model');
const ledgerModel=require('./ledger.model');

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
accountSchema.methods.getBalance = async function(){
    /*aggregation pipeline feature of MongoDb   
    1. Match stage to filter ledger entries for the account
    2. Group stage to calculate total debits and credits
    3. Project stage to calculate final balance (credits - debits)
    4. Handle case where there are no ledger entries for the account (balance should be 0)   
    */

    const balanceData=await ledgerModel.aggregate([
        {$match:{account:this._id}},
        {
            $group:{
                _id:null,
                totalDebit:{
                    $sum:{
                        $cond:[
                            {$eq:['$type','DEBIT']},
                            '$amount',
                            0
                        ]
                    }
                },
                totalCredit:{
                    $sum:{
                        $cond:[
                            {$eq:['$type','CREDIT']},
                            '$amount',
                            0
                        ]
                    }
                }
            }
        },
        {
            $project:{
                _id:0,
                balance:{$subtract:['$totalCredit','$totalDebit']}
            }
        }
    ]);

    if (balanceData.length===0){
        return 0;
    }
    return balanceData[0].balance;
}

const accountModel=mongoose.model('Account',accountSchema);
module.exports=accountModel;    
