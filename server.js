// server will be started in here
require('dotenv').config();
const app=require('./src/app');
const port = Number.parseInt((process.env.PORT || '3000').replace(/;\s*$/, ''), 10) || 3000;
const connectDB=require('./src/config/db');

async function startServer(){
    const isDbConnected=await connectDB();

    app.listen(port,()=>{
        console.log(`Server is running on port ${port}`);
        if(!isDbConnected){
            console.warn('Running without MongoDB connection. Database operations will fail until connection is restored.');
        }
    });
}

startServer();