// Create the server and to Configure the app will be done in this file

const express = require('express');
const app=express();
const cookies=require('cookie-parser');


app.use(express.json());
app.use(cookies()); 
// Routes
const accountRoutes=require('./routes/account.routes');
const authRoutes=require('./routes/auth.routes');
//Use Routes
app.use('/api/accounts',accountRoutes);
app.use('/api/auth',authRoutes);








module.exports=app;