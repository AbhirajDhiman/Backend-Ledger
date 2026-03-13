console.log('transaction.routes.js loaded');
const express = require('express');
const transactionController = require('../controllers/transaction.controller');
const authMiddleware=require('../middleware/auth.middleware');

const transactionRoutes = express.Router();

transactionRoutes.get('/',authMiddleware.authMiddleware,transactionController.getUserTransactions);

/*
* POST /api/transactions
* Creates a new transaction between two accounts. The request body should include the fromaccount, toaccount, amount, and idempotencyKey. The endpoint should validate the input data, create a new transaction with a status of PENDING, and return the created transaction details in the response.
*/

transactionRoutes.post('/',authMiddleware.authMiddleware,transactionController.createTransaction);

if(typeof transactionController.createInitialTransaction==='function'){
	transactionRoutes.post('/system/initialfund',authMiddleware.authSystemUserMiddleware,transactionController.createInitialTransaction);
}
module.exports = transactionRoutes;