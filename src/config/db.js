const mongoose=require('mongoose');

function connectDB(){
    const mongoUri = process.env.MONGO_URI;

    if (!mongoUri) {
        console.error('MongoDB URI is missing. Set MONGO_URI in .env');
        process.exit(1);
    }

    mongoose.connect(mongoUri)
    .then(()=>{
        console.log('Connected to MongoDB');
    }).catch((err)=>{
        console.error('Error connecting to MongoDB',err);
        process.exit(1);
    })
}

module.exports=connectDB;