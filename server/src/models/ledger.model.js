console.log('ledger.model.js loaded');
const express = require('express');
const mongoose = require('mongoose');
const LedgerSchema = new mongoose.Schema({
    account: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account',
        required: [true, 'account is required for creating a ledger entry'],
        index: true,
        immutable: true,
    },
    amount:{
        type: Number,
        required: [true, 'amount is required for creating a ledger entry'],
    },
    transaction: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transaction',
        required: [true, 'transaction is required for creating a ledger entry'],
        index: true,
        immutable: true,
    },
    type: {
        type: String,
        enum:{
            values: ['DEBIT', 'CREDIT'],
            message: 'type can either be DEBIT or CREDIT'
        },
        required: [true, 'type is required for creating a ledger entry'],
        immutable: true,
        }
});

function preventLedgerModification(next) {
    throw new Error('Ledger entries cannot be modified after creation');
}
LedgerSchema.pre('deleteOne', preventLedgerModification);
LedgerSchema.pre('updateOne', preventLedgerModification);
LedgerSchema.pre('findOneAndUpdate', preventLedgerModification);
LedgerSchema.pre('findOneAndDelete', preventLedgerModification);
LedgerSchema.pre('findOneAndReplace', preventLedgerModification);
LedgerSchema.pre('remove', preventLedgerModification);
LedgerSchema.pre('deleteMany', preventLedgerModification);

const LedgerModel = mongoose.model('Ledger', LedgerSchema);
module.exports = LedgerModel;