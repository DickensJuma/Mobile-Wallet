const Transaction = require('../models/Transaction');
const User = require('../models/User');


const getWalletInfo = async (req, res) => {
    try {
        const { email } = req.body;
    
        // Find the user with the specified ID
        const user = await User.findOne({ email });
        if (!user) {
          return res.status(400).json({ message: 'user not found' });
        }
    
     
        //user,wallet

        res.status(200).json({ wallet: user.wallet });
       
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
      }
    }


const walletWithdraw = async (req, res) => {
    
  const { email, currency, amount } = req.body;
  const { userId } = req.user;

  // Check if the user has made more than 2 transactions in the last 2 minutes
  const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
  const transactionCount = await Transaction.countDocuments({
    userId,
    createdAt: { $gte: twoMinutesAgo },
  });
  if (transactionCount > 2) {
    return res.status(429).json({ message: 'Too many transactions in the last 2 minutes' });
  }

  // Check if the user has exceeded the maximum number of transactions per day (24-hour window)
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
  const transactionCountToday = await Transaction.countDocuments({
    userId,
    createdAt: { $gte: today, $lt: tomorrow },
  });
  if (transactionCountToday >= 10) {
    return res.status(400).json({ message: 'Exceeded maximum number of transactions per day' });
  }

  try {
   
    
    // Find the user with the specified ID
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'user not found' });
    }
    let wallet =user.wallet;

    const balance = wallet.balance.get(currency) || 0;
    if (balance < amount) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    // Deduct the amount from the wallet balance
    wallet.balance.set(currency, balance - amount);
    await wallet.save();

    // Record the transaction
    const transaction = new Transaction({
      userId,
      email,
      type: 'withdraw',
      currency,
      amount,
    });
    await transaction.save();

    return res.json({ message: 'Withdrawal successful' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

const walletTransfer = async (req, res) => {
    try {
      const { fromUserId, toUserId, amount } = req.body;
      const fromUser = await User.findById(fromUserId);
      const toUser = await User.findById(toUserId);
  
      if (!fromUser || !toUser) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }
  
      const fromWallet = fromUser.wallet;
      const toWallet = toUser.wallet;
  
      if (!fromWallet || !toWallet) {
        return res.status(400).json({ message: 'One or both users do not have a wallet' });
      }
  
      if (fromWallet.balance < amount) {
        return res.status(400).json({ message: 'Insufficient balance' });
      }
  
      const transaction = new Transaction({
        type: 'transfer',
        fromUserId,
        toUserId,
        amount,
        timestamp: new Date()
      });
      function updateBalance(amount, transaction) {
        this.balance += amount;
        this.transactions.push(transaction);
        return this.save();
      }
  
      const updatedFromWallet = updateBalance(amount * -1, transaction.bind(fromWallet))
      const updatedToWallet =  updateBalance(amount, transaction.bind(toWallet))
  
      return res.status(200).json({ message: 'Transfer successful', fromWallet: updatedFromWallet, toWallet: updatedToWallet });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Server error' });
    }
  }

 const  walletCredit = async (req, res) => {
    try {
      const {email, amount, currency, reference } = req.body;
  
      // Find the user with the specified ID

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ message: 'user not found' });
      }
      let wallet =user.wallet;
      // Update the wallet balance
      wallet.balance[currency] += amount;

    //  update user wallet
      user.wallet = wallet;
  
      // Create a new transaction
      const transaction = new Transaction({
        email,
        amount,
        currency,
        type: 'credit',
        status: 'success',
        reference,
      });
  
      // Save the wallet and transaction objects to the database
      await user.save();
    
      await transaction.save();
  
      res.json({ message: 'Transaction successful' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };
  
  const walletRequestRevarsal = async(req, res) => {

    try {
      // Check if user is authenticated

      // if (!req.session.user) {
      //   return res.status(401).json({ message: 'Unauthorized' });
      // }

  
      // Get user and wallet information
      const user = await User.findById(req.session.user._id);
      const wallet = user.wallet;
  
      // Check if wallet exists
      if (!wallet) {
        return res.status(404).json({ message: 'Wallet not found' });
      }
  
      // Get transaction id from request body
      const { transactionId } = req.body;
  
      // Check if transaction id is provided
      if (!transactionId) {
        return res.status(400).json({ message: 'Transaction id is required' });
      }
  
      // Find transaction in database
      const transaction = await Transaction.findOne({ _id: transactionId });
  
      // Check if transaction exists and is from the user's wallet
      if (!transaction || !wallet.transactions.includes(transaction._id)) {
        return res.status(404).json({ message: 'Transaction not found' });
      }
  
      // Check if transaction is older than 24 hours
      const timeDiff = new Date() - transaction.timestamp;
      const hoursDiff = timeDiff / (1000 * 60 * 60);
      if (hoursDiff > 24) {
        return res.status(400).json({ message: 'Transaction is older than 24 hours and cannot be reversed' });
      }
  
      // Check if transaction has already been reversed
      if (transaction.reversed) {
        return res.status(400).json({ message: 'Transaction has already been reversed' });
      }
  
      // Update wallet balance and transaction status
      wallet.balance += transaction.amount;
      transaction.reversed = true;

      user.wallet = wallet;
      await user.save();
      await transaction.save();
  
      // Return success message
      res.json({ message: 'Transaction reversal request successful' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }


module.exports = {
    getWalletInfo,
   walletWithdraw,
   walletTransfer,
    walletCredit,
    walletRequestRevarsal
}

