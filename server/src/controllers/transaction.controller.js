console.log('transaction.controller.js loaded');
const Transaction = require('../models/transaction.model');
const ledgerModel = require('../models/ledger.model');
const emailService = require('../services/email.service');
const accountModel = require('../models/account.model');
const mongoose = require('mongoose');
/*
-- Create a new transaction
THE 10-STEP TRANSFER FLOW:
    1. Validate request
    2. Validate idempotency key
    3. Check account status
    4. Derive sender balance from ledger
    5. Create transaction (PENDING)
    6. Create DEBIT ledger entry
    7. Create CREDIT ledger entry
    8. Mark transaction COMPLETED
    9. Commit MongoDB session
   10. Send email notification
*/
async function createTransaction(req,res){
    let session;
    try{
        // Step 1: Validate request
        const {fromaccount,toaccount,amount,idempotencyKey}=req.body;
        if(!fromaccount || !toaccount || !amount || !idempotencyKey){
            return res.status(400).json({
                error:'fromaccount, toaccount, amount and idempotencyKey are required'
            });
        }

        const fromAccount=await accountModel.findById(fromaccount);
        const toAccount=await accountModel.findById(toaccount);
        if(!fromAccount || !toAccount){
            return res.status(404).json({
                error:'fromaccount or toaccount not found'
            });
        }

        // Step 2: Validate idempotency key
        const existingTransaction=await Transaction.findOne({
            idempotencyKey:idempotencyKey
        });
        if(existingTransaction){
            if(existingTransaction.status==='PENDING'){
                return res.status(200).json(existingTransaction);
            }

            if(existingTransaction.status==='COMPLETED'){
                return res.status(200).json(existingTransaction);
            }

            if(existingTransaction.status==='FAILED'){
                return res.status(500).json({
                    error:'A transaction with the same idempotency key has already failed. Please use a different idempotency key.'
                });
            }

            if(existingTransaction.status==='REVERSED'){
                return res.status(500).json({
                    error:'A transaction with the same idempotency key has already been reversed. Please use a different idempotency key.'
                });
            }
        }

        // Step 3: Check account status
        if(fromAccount.accountType!=='ACTIVE' || toAccount.accountType!=='ACTIVE'){
            return res.status(400).json({
                error:'fromaccount or toaccount is not ACTIVE'
            });
        }

        // Step 4: Derive sender balance from ledger
        const balance = await fromAccount.getBalance();
        if(balance<amount){
            return res.status(400).json({
                error:'Insufficient balance in fromaccount'
            });
        }

        // Step 5: Create transaction (PENDING)
        session=await Transaction.startSession();
        session.startTransaction();

        const transaction=await Transaction.create([{
            fromaccount,
            toaccount,
            amount,
            idempotencyKey,
            status:'PENDING'
        }],{session:session});

        // Step 6: Create DEBIT ledger entry
        const debitEntry=await ledgerModel.create([{
            account:fromaccount,
            amount:amount,
            transaction:transaction[0]._id,
            type:'DEBIT'
        }],{session:session});

        // Step 7: Create CREDIT ledger entry
        const creditEnter=await ledgerModel.create([{
            account:toaccount,
            amount:amount,
            transaction:transaction[0]._id,
            type:'CREDIT'
        }],{session:session});

        transaction[0].status='COMPLETED';
        await transaction[0].save({session:session});
        // Step 8: Mark transaction COMPLETED

        // Step 9: Commit MongoDB session
        await session.commitTransaction();
        session.endSession();

        // Step 10: Send email notification
        await emailService.sendEmail(
            req.user.email,
            'Transaction completed successfully',
            `Hi ${req.user.name}, your transfer of ${amount} has been completed.`,
            `<p>Hi <b>${req.user.name}</b>, your transfer of <b>${amount}</b> has been completed.</p>`
        );

        return res.status(201).json({
            message:'Transaction completed successfully',
            transaction:transaction[0]
        });
    }catch(error){
        if(session){
            await session.abortTransaction();
            session.endSession();
        }
        return res.status(500).json({
            error:error.message || 'Transaction failed'
        });
    }
}

async function getUserTransactions(req,res){
    try{
        const accounts=await accountModel.find({ userId:req.user._id }).select('_id').lean();
        const accountIds=accounts.map((account)=>account._id);

        if(accountIds.length===0){
            return res.status(200).json({
                transactions: []
            });
        }

        const transactions=await Transaction.find({
            $or:[
                { fromaccount: { $in: accountIds } },
                { toaccount: { $in: accountIds } }
            ]
        })
            .sort({ createdAt: -1 })
            .limit(20)
            .populate('fromaccount', 'currency accountType')
            .populate('toaccount', 'currency accountType')
            .lean();

        return res.status(200).json({
            transactions
        });
    }catch(error){
        return res.status(500).json({
            error:error.message || 'Unable to load transactions'
        });
    }
}

async function createInitialTransaction(req,res){
    let session;
    try{
        const {toaccount,amount,idempotencyKey}=req.body;
        if(!toaccount || !amount || !idempotencyKey){
            return res.status(400).json({
                error:'toaccount, amount and idempotencyKey are required'
            });
        }

        const toUserAccount=await accountModel.findById(toaccount);
        if(!toUserAccount){
            return res.status(404).json({
                error:'toaccount not found'
            });
        }

        const fromAccount=await accountModel.findOne({
            userId:req.user._id,
            accountType:'ACTIVE'
        });

        if(!fromAccount){
            return res.status(500).json({
                error:'System account not found'
            });
        }

        session=await mongoose.startSession();
        session.startTransaction();

        const transaction=await Transaction.create([{
            fromaccount:fromAccount._id,
            toaccount,
            amount,
            idempotencyKey,
            status:'PENDING'
        }],{session:session});

        await ledgerModel.create([{
            account:fromAccount._id,
            amount,
            transaction:transaction[0]._id,
            type:'DEBIT'
        }],{session:session});

        await ledgerModel.create([{
            account:toaccount,
            amount,
            transaction:transaction[0]._id,
            type:'CREDIT'
        }],{session:session});

        transaction[0].status='COMPLETED';
        await transaction[0].save({session:session});
        await session.commitTransaction();
        session.endSession();

        return res.status(201).json({
            message:'Initial transaction completed successfully',
            transaction:transaction[0]
        });
    }catch(error){
        if(session){
            await session.abortTransaction();
            session.endSession();
        }
        return res.status(500).json({
            error:error.message || 'Initial transaction failed'
        });
    }
}
async function depositFunds(req, res) {
    let session;
    try {
        const { accountId, amount } = req.body;
        if (!accountId || !amount || Number(amount) <= 0) {
            return res.status(400).json({ error: 'accountId and a positive amount are required' });
        }

        // Only allow deposit into the authenticated user's own account
        const account = await accountModel.findOne({ _id: accountId, userId: req.user._id });
        if (!account) {
            return res.status(404).json({ error: 'Account not found' });
        }
        if (account.accountType !== 'ACTIVE') {
            return res.status(400).json({ error: 'Account is not ACTIVE' });
        }

        const idempotencyKey = `deposit-${req.user._id}-${accountId}-${Date.now()}`;

        session = await mongoose.startSession();
        session.startTransaction();

        // Create a DEPOSIT transaction record (self-referential: external → account)
        const transaction = await Transaction.create([{
            fromaccount: accountId,
            toaccount: accountId,
            amount: Number(amount),
            idempotencyKey,
            status: 'PENDING'
        }], { session });

        // Credit-only ledger entry (demo faucet – funds come from outside the system)
        await ledgerModel.create([{
            account: accountId,
            amount: Number(amount),
            transaction: transaction[0]._id,
            type: 'CREDIT'
        }], { session });

        transaction[0].status = 'COMPLETED';
        await transaction[0].save({ session });

        await session.commitTransaction();
        session.endSession();

        const newBalance = await account.getBalance();
        return res.status(201).json({
            message: 'Deposit successful',
            accountId,
            deposited: Number(amount),
            balance: newBalance
        });
    } catch (error) {
        if (session) {
            await session.abortTransaction();
            session.endSession();
        }
        return res.status(500).json({ error: error.message || 'Deposit failed' });
    }
}

module.exports={
    getUserTransactions,
    createTransaction,
    createInitialTransaction,
    depositFunds
};