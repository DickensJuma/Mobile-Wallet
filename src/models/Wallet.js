const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  walletId: {
    type: String,
    required: true,
    unique: true,
  },
  balance: {
    type: Map,
    of: Number,
    required: true,
    default: {},
  },
  transactions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction',
  }],
});

module.exports = mongoose.model('Wallet', walletSchema);
