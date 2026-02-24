// server will be started in here
require('dotenv').config();
const app=require('./src/app');
const port = Number.parseInt((process.env.PORT || '3000').replace(/;\s*$/, ''), 10) || 3000;
const connectDB=require('./src/config/db');

// Connect to MongoDB
connectDB();

app.listen(port,()=>{
    console.log(`Server is running on port ${port}`);
})