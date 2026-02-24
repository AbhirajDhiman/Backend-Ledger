// Create the server and to Configure the app will be done in this file

const express = require('express');
const app=express();
const cookies=require('cookie-parser');
const router=require('./routes/auth.routes');


app.use(express.json());
app.use(cookies()); 
app.use('/api/auth',router);








module.exports=app;