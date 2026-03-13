// Create the server and to Configure the app will be done in this file

const express = require('express');
const cors = require('cors');
const app=express();
const cookies=require('cookie-parser');

const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);


app.use(cors({
    origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        return callback(new Error('Origin not allowed by CORS'));
    },
    credentials: true
}));
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
    res.status(200).json({
        name: 'Backend-Ledger API',
        status: 'running',
        docs: {
            health: '/health',
            auth: '/api/auth',
            accounts: '/api/accounts',
            transactions: '/api/transactions'
        }
    });
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