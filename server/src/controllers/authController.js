import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import sendEmail from '../utils/sendEmail.js';

export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(400).json({ message: 'An account with this email already exists' });

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      onboardingCompleted: false,
      onboardingStep: 0,
      notifications: [{
        message: `Welcome to Midnight Sanctuary, ${name.trim()}! Begin your first journal entry.`,
        type: 'success',
      }],
    });

    // Send welcome email (non-blocking)
    sendEmail({
      to: user.email,
      subject: '🌙 Welcome to Midnight Sanctuary',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#081425;color:#D8E3FB;padding:32px;border-radius:12px;">
          <h1 style="color:#fff;font-size:24px;margin-bottom:8px;">Welcome, ${user.name} 🌙</h1>
          <p style="color:#5B7FA6;margin-bottom:24px;">Your sanctuary awaits. Begin your journey to digital stillness.</p>
          <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/app" 
             style="display:inline-block;background:#6366F1;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">
            Enter the Sanctuary
          </a>
        </div>
      `,
    }).catch(console.error);

    generateToken(res, user._id);
    const { passwordHash: _, resetPasswordToken, resetPasswordExpires, ...safeUser } = user.toObject();
    res.status(201).json(safeUser);
  } catch (e) {
    console.error('Register error:', e);
    res.status(500).json({ message: 'Server error during registration', error: e.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ message: 'Invalid email or password' });

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return res.status(401).json({ message: 'Invalid email or password' });

    generateToken(res, user._id);
    const { passwordHash, resetPasswordToken, resetPasswordExpires, ...safeUser } = user.toObject();
    res.status(200).json(safeUser);
  } catch (e) {
    console.error('Login error:', e);
    res.status(500).json({ message: 'Server error during login', error: e.message });
  }
};

export const logoutUser = async (req, res) => {
  try {
    res.cookie('jwt', '', { httpOnly: true, expires: new Date(0) });
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (e) {
    res.status(500).json({ message: 'Logout error', error: e.message });
  }
};

// @desc   Request password reset
// @route  POST /api/auth/forgot-password
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    // Always respond 200 to avoid user enumeration
    if (!user) return res.status(200).json({ message: 'If that email exists, a reset link has been sent.' });

    const token = crypto.randomBytes(32).toString('hex');
    const hash = crypto.createHash('sha256').update(token).digest('hex');

    user.resetPasswordToken = hash;
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save();

    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password?token=${token}`;

    await sendEmail({
      to: user.email,
      subject: '🔐 Reset Your Midnight Sanctuary Password',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#081425;color:#D8E3FB;padding:32px;border-radius:12px;">
          <h1 style="color:#fff;font-size:20px;margin-bottom:8px;">Password Reset Request</h1>
          <p style="color:#5B7FA6;margin-bottom:24px;">Click the button below to reset your password. This link expires in 1 hour.</p>
          <a href="${resetUrl}" 
             style="display:inline-block;background:#6366F1;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">
            Reset Password
          </a>
          <p style="color:#5B7FA6;margin-top:24px;font-size:12px;">If you didn't request this, ignore this email. Your password won't change.</p>
        </div>
      `,
    });

    res.status(200).json({ message: 'If that email exists, a reset link has been sent.' });
  } catch (e) {
    console.error('Forgot password error:', e);
    res.status(500).json({ message: 'Server error', error: e.message });
  }
};

// @desc   Reset password with token
// @route  POST /api/auth/reset-password
export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ message: 'Token and new password are required' });
    if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });

    const hash = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hash,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) return res.status(400).json({ message: 'Invalid or expired reset token' });

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(password, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({ message: 'Password reset successfully. Please log in.' });
  } catch (e) {
    console.error('Reset password error:', e);
    res.status(500).json({ message: 'Server error', error: e.message });
  }
};
