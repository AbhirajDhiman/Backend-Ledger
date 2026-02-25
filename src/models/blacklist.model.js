const mongoose=require('mongoose');
const tokenBlacklistSchema=new mongoose.Schema({
    token:{
        type:String,
        required:[true,'Token is required for blacklisting'],
        unique:true,
        index:true
    },
    blacklistedAt:{
        type:Date,
        default:Date.now
    }
},{
    timestamps:true
});

tokenBlacklistSchema.index(
    {blacklistedAt:1},
    {expireAfterSeconds:60*60*24*30}
); //for faster lookups(searching)

const tokenBlacklistModel=mongoose.model('TokenBlacklist',tokenBlacklistSchema);
module.exports=tokenBlacklistModel;