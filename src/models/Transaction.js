const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  email: {
    type: String,

  },
  fromUserId: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',


  },
  toUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',

  },
  amount: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['credit', 'debit', 'transfer', 'reversal'],
    required: true,
  },
  status: {
    type: String,
    enum: ['success', 'pending', 'failed'],
    required: true,
  },
  reference: {
    type: String,
    required: true,
  },
  remarks: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
