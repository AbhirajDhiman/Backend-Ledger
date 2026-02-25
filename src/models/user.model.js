const mongoose=require('mongoose');
const bcrypt=require('bcrypt');
const userSchema=new mongoose.Schema({
   email:{
    type:String,
    required:[true,'Email is required'],
    unique:[true,'Email already exists'],
    lowercase:true,
    trim:true,
    match:[/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,'Please fill a valid email address'] 
   },
   name:{
    type:String,
    required:[true,'Name is required'],
    trim:true
   },
   password:{
    type:String,
    required:[true,'Password is required'],
    minlength:[8,'Password must be at least 8 characters long'],
    select:false
   },
   systemuser:{
    type:Boolean,
    default:false,
    immutable:true,
    select:false
   }
},{
    timestamps:true
});


userSchema.pre('save',async function(){
    if(!this.isModified('password')){
        return;
    }

    const hash = await bcrypt.hash(this.password, 10);
    this.password=hash;
})

userSchema.methods.comparePassword=async function(candidatePassword){
    return await bcrypt.compare(candidatePassword,this.password);
}

const userModel=mongoose.model('User',userSchema);
module.exports=userModel;