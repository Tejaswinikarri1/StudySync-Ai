const crypto = require('crypto');
const jwt    = require('jsonwebtoken');
const User   = require('../models/User');
const { sendEmail, verificationEmailHtml, passwordResetHtml } = require('../utils/email');

const gradients = [
  '135deg,#6366f1,#8b5cf6','135deg,#ec4899,#f43f5e',
  '135deg,#10b981,#06b6d4','135deg,#f59e0b,#ef4444',
  '135deg,#22d3ee,#3b82f6','135deg,#a78bfa,#ec4899',
];

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// POST /api/auth/register
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, ...rest } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }

    const count = await User.countDocuments();
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const user = await User.create({
      name, email, password,
      grad: gradients[count % gradients.length],
      verificationToken: crypto.createHash('sha256').update(verificationToken).digest('hex'),
      verificationExpiry: Date.now() + 24 * 60 * 60 * 1000,
      ...rest,
    });

    const verifyUrl = `${process.env.CLIENT_URL}/verify/${verificationToken}`;

    try {
      await sendEmail({
        to: email,
        subject: 'Verify your StudySync AI account',
        html: verificationEmailHtml(name, verifyUrl),
      });
    } catch (emailErr) {
      console.warn('Email send failed (check SMTP config):', emailErr.message);
    }

    res.status(201).json({
      success: true,
      message: 'Account created! Please check your email to verify your account.',
      email,
    });
  } catch (err) { next(err); }
};

// GET /api/auth/verify/:token
exports.verifyEmail = async (req, res, next) => {
  try {
    const hashed = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user   = await User.findOne({
      verificationToken:  hashed,
      verificationExpiry: { $gt: Date.now() },
    }).select('+verificationToken +verificationExpiry');

    if (!user) {
      return res.status(400).json({ success: false, message: 'Verification link is invalid or expired.' });
    }

    user.isVerified        = true;
    user.verificationToken  = undefined;
    user.verificationExpiry = undefined;
    await user.save();

    res.json({ success: true, message: 'Email verified! You can now log in.' });
  } catch (err) { next(err); }
};

// POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'No account found with this email.' });
    }

    const ok = await user.comparePassword(password);
    if (!ok) {
      return res.status(401).json({ success: false, message: 'Incorrect password.' });
    }

    const token = signToken(user._id);

    res.json({
      success: true,
      token,
      user: user.toJSON(),
    });
  } catch (err) { next(err); }
};

// POST /api/auth/forgot-password
exports.forgotPassword = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email?.toLowerCase() });
    if (!user) {
      return res.status(404).json({ success: false, message: 'No account found with this email.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken  = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpiry = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save();

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    try {
      await sendEmail({
        to: user.email,
        subject: 'Reset your StudySync AI password',
        html: passwordResetHtml(user.name, resetUrl),
      });
    } catch (emailErr) {
      user.resetPasswordToken  = undefined;
      user.resetPasswordExpiry = undefined;
      await user.save();
      return res.status(500).json({ success: false, message: 'Email could not be sent. Check SMTP config.' });
    }

    res.json({ success: true, message: 'Password reset link sent to your email.' });
  } catch (err) { next(err); }
};

// POST /api/auth/reset-password/:token
exports.resetPassword = async (req, res, next) => {
  try {
    const hashed = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user   = await User.findOne({
      resetPasswordToken:  hashed,
      resetPasswordExpiry: { $gt: Date.now() },
    }).select('+resetPasswordToken +resetPasswordExpiry');

    if (!user) {
      return res.status(400).json({ success: false, message: 'Reset link is invalid or expired.' });
    }

    if (!req.body.password || req.body.password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    user.password            = req.body.password;
    user.resetPasswordToken  = undefined;
    user.resetPasswordExpiry = undefined;
    await user.save();

    const token = signToken(user._id);
    res.json({ success: true, token, message: 'Password reset successful.' });
  } catch (err) { next(err); }
};
