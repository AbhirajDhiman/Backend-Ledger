// Create the server and to Configure the app will be done in this file

const express = require('express');
const app=express();
const cookies=require('cookie-parser');


app.use(express.json());
app.use(cookies()); 
// Routes
const accountRoutes=require('./routes/account.routes');
const authRoutes=require('./routes/auth.routes');
const transactionRoutes=require('./routes/transaction.routes');
//Use Routes
app.use('/api/accounts',accountRoutes);
app.use('/api/auth',authRoutes);
app.use('/api/transactions',transactionRoutes);


app.get('/',(req,res)=>{
    res.send('Welcome to the Ledger API');
});

// Health check endpoint
app.get('/health',(req,res)=>{
    res.status(200).json({
        status:'ok',
        message:'Backend-Ledger API is healthy',
        timestamp:new Date().toISOString()
    });
});






module.exports=app;