const User = require('../models/User');
const Transaction = require('../models/Transaction');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config()

const nodemailer = require('nodemailer');


// Create nodemailer transporter object
const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});



const signup = async (req, res) => {
  try {
    const { email, password, wallet } = req.body;
    console.log(email, password, wallet)
    const user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const newUser = new User({
      email,
      password: hashedPassword,
      wallet,
      verificationCode,
    });
    console.log(newUser)
    await newUser.save();
    // Send verification email if user is created successfully


    const mailOptions = {
      from: '"process.env.EMAIL_USER" noreply@waya.com',
      to: email,
      subject: 'Email Verification',
      text: `Your verification code is ${verificationCode}.`,
    };

    await transporter.sendMail(mailOptions);


    res.json({ message: 'User created successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

//signin
const signin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check if user has verified their email
    if (!user.isEmailVerified) {
      return res.status(401).json({ message: 'Email not verified' });
    }

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

    res.json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

//verify email
const verifyEmail = async (req, res) => {
  try {
    const { verificationCode } = req.body;

    // Find user by email verification code
    const user = await User.findOne({ verificationCode });
    if (!user) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    // Check if email is already verified
    if (user.isEmailVerified) {
      return res.status(400).json({ message: 'Email is already verified' });
    }

    // Mark email as verified
    user.isEmailVerified = true;
    user.verificationCode = undefined;
    await user.save();

    res.json({ message: 'Email successfully verified' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


//forgot password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    // Generate new password
    const newPassword = Math.random().toString(36).slice(-8);

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update user password
    user.password = hashedPassword;
    await user.save();

    //Send email with new password

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset',
      text: `Your new password is ${newPassword}.`,
    };

    await transporter.sendMail(mailOptions);


    res.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }



}


//reset password
const resetPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    // Generate new password
    const newPassword = Math.random().toString(36).slice(-8);

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update user password
    user.password = hashedPassword;
    await user.save();

    // Send email with new password
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset',
      text: `Your new password is ${newPassword}.`,
    };
    await transporter.sendMail(mailOptions);




    res.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

//resend verification email
const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    // Generate new email verification code
    const emailVerificationCode = Math.random().toString(36).slice(-8);

    // Update user email verification code
    user.verificationCode = emailVerificationCode;
    await user.save();

    // Send email verification code to user
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Email Verification Code',
      text: `Your email verification code is ${emailVerificationCode}.`,
    };
    await transporter.sendMail(mailOptions);

    res.json({ message: 'Email verification code sent' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

//get wallet info
const getWalletInfo = async (req, res) => {
  try {
    const { walletId } = req.query;

    // Find transactions for the specified walletId
    const transactions = await Transaction.find({ walletId });
    if (!transactions) {
      return res.status(400).json({ message: 'Transactions not found' });
    }

    res.json({ transactions });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

module.exports = { 
  signup,
  signin,
  verifyEmail,
  forgotPassword,
  resetPassword ,
  resendVerificationEmail,
  getWalletInfo
};


