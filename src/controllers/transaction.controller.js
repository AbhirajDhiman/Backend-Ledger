console.log('transaction.controller.js loaded');
const Transaction = require('../models/transaction.model');
const ledgerModel = require('../models/ledger.model');
const emailService = require('../services/email.service');
const accountModel = require('../models/account.model');
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
        const existingTransaction=await Transaction.findOne({idempotencyKey:idempotencyKey});
        if(existingTransaction){
            if(existingTransaction.status==='PENDING' || existingTransaction.status==='COMPLETED'){
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
        await ledgerModel.create([{
            account:fromaccount,
            amount:amount,
            transaction:transaction[0]._id,
            type:'DEBIT'
        }],{session:session});

        // Step 7: Create CREDIT ledger entry
        await ledgerModel.create([{
            account:toaccount,
            amount:amount,
            transaction:transaction[0]._id,
            type:'CREDIT'
        }],{session:session});

        transaction[0].status='COMPLETED';
        await transaction[0].save({session:session});

        // Step 8 & 9: Mark transaction COMPLETED and Commit MongoDB session
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

module.exports={
    createTransaction
};