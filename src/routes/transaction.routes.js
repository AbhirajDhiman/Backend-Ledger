const router = require('express').Router();
const transactionController = require('../controllers/transaction.controller');

const transactionRoutes = Router();

/*
* POST /api/transactions
* Creates a new transaction between two accounts. The request body should include the fromaccount, toaccount, amount, and idempotencyKey. The endpoint should validate the input data, create a new transaction with a status of PENDING, and return the created transaction details in the response.
*/

transactionRoutes.post('/',authmiddleware.authmiddleware);
