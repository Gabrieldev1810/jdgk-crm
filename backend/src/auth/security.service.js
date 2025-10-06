const bcrypt = require('bcrypt');
const crypto = require('crypto');

// Optional nodemailer - only needed for production email sending
let nodemailer;
try {
  nodemailer = require('nodemailer');
} catch (e) {
  console.log('📧 Nodemailer not available - email sending will be logged only');
}

class SecurityService {
  constructor(prisma) {
    this.prisma = prisma;
    this.MAX_LOGIN_ATTEMPTS = 5;
    this.LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
    this.EMAIL_VERIFY_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours
    this.PASSWORD_RESET_EXPIRY = 1 * 60 * 60 * 1000; // 1 hour
  }

  // Password strength validation
  validatePasswordStrength(password) {
    const minLength = 12;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    const errors = [];
    
    if (password.length < minLength) {
      errors.push(`Password must be at least ${minLength} characters long`);
    }
    if (!hasUpperCase) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!hasLowerCase) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!hasNumbers) {
      errors.push('Password must contain at least one number');
    }
    if (!hasSpecialChars) {
      errors.push('Password must contain at least one special character');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      strength: this.calculatePasswordStrength(password)
    };
  }

  calculatePasswordStrength(password) {
    let score = 0;
    
    // Length scoring
    if (password.length >= 12) score += 25;
    else if (password.length >= 8) score += 10;
    
    // Character variety scoring
    if (/[a-z]/.test(password)) score += 15;
    if (/[A-Z]/.test(password)) score += 15;
    if (/\d/.test(password)) score += 15;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 15;
    
    // Additional complexity
    if (password.length >= 16) score += 10;
    if (/[!@#$%^&*(),.?":{}|<>].*[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 5;
    
    if (score >= 85) return 'Very Strong';
    if (score >= 70) return 'Strong';
    if (score >= 50) return 'Medium';
    if (score >= 25) return 'Weak';
    return 'Very Weak';
  }

  // Account lockout management
  async checkAccountLockout(userId) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        failedLoginAttempts: true,
        accountLockedUntil: true,
        email: true
      }
    });

    if (!user) return { isLocked: false };

    // Check if account is currently locked
    if (user.accountLockedUntil && new Date(user.accountLockedUntil) > new Date()) {
      const unlockTime = new Date(user.accountLockedUntil);
      return {
        isLocked: true,
        unlockTime,
        message: `Account locked until ${unlockTime.toLocaleString()}`
      };
    }

    // Reset lock if expired
    if (user.accountLockedUntil && new Date(user.accountLockedUntil) <= new Date()) {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          failedLoginAttempts: 0,
          accountLockedUntil: null,
          lastFailedLogin: null
        }
      });
    }

    return { isLocked: false, attempts: user.failedLoginAttempts };
  }

  async recordFailedLogin(userId) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { failedLoginAttempts: true, email: true }
    });

    const newAttempts = (user?.failedLoginAttempts || 0) + 1;
    const shouldLock = newAttempts >= this.MAX_LOGIN_ATTEMPTS;

    const updateData = {
      failedLoginAttempts: newAttempts,
      lastFailedLogin: new Date()
    };

    if (shouldLock) {
      updateData.accountLockedUntil = new Date(Date.now() + this.LOCKOUT_DURATION);
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: updateData
    });

    return {
      attempts: newAttempts,
      isLocked: shouldLock,
      lockoutDuration: shouldLock ? this.LOCKOUT_DURATION / 1000 / 60 : 0 // minutes
    };
  }

  async recordSuccessfulLogin(userId) {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: 0,
        accountLockedUntil: null,
        lastFailedLogin: null,
        lastLogin: new Date()
      }
    });
  }

  // Email verification
  generateVerificationToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  async sendVerificationEmail(email, token) {
    // Configure your email provider here
    // For development, we'll just log the token
    console.log(`📧 Email verification token for ${email}: ${token}`);
    console.log(`🔗 Verification URL: http://localhost:3001/auth/verify-email?token=${token}`);
    
    // In production, implement actual email sending:
    /*
    const transporter = nodemailer.createTransporter({
      // Your email configuration
    });
    
    await transporter.sendMail({
      from: 'noreply@dialcraft.com',
      to: email,
      subject: 'Verify Your Email Address',
      html: `<p>Click <a href="http://localhost:3001/auth/verify-email?token=${token}">here</a> to verify your email.</p>`
    });
    */
  }

  async createEmailVerification(userId, email) {
    const token = this.generateVerificationToken();
    const expires = new Date(Date.now() + this.EMAIL_VERIFY_EXPIRY);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        emailVerifyToken: token,
        emailVerifyExpires: expires
      }
    });

    await this.sendVerificationEmail(email, token);
    return token;
  }

  async verifyEmail(token) {
    const user = await this.prisma.user.findFirst({
      where: {
        emailVerifyToken: token,
        emailVerifyExpires: {
          gt: new Date()
        }
      }
    });

    if (!user) {
      throw new Error('Invalid or expired verification token');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerifyToken: null,
        emailVerifyExpires: null
      }
    });

    return user;
  }

  // Password reset functionality
  async createPasswordReset(email) {
    const user = await this.prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      // Don't reveal if email exists
      return { success: true };
    }

    const token = this.generateVerificationToken();
    const expires = new Date(Date.now() + this.PASSWORD_RESET_EXPIRY);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: token,
        passwordResetExpires: expires
      }
    });

    console.log(`🔑 Password reset token for ${email}: ${token}`);
    console.log(`🔗 Reset URL: http://localhost:3001/auth/reset-password?token=${token}`);

    return { success: true };
  }

  async resetPassword(token, newPassword) {
    const user = await this.prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: {
          gt: new Date()
        }
      }
    });

    if (!user) {
      throw new Error('Invalid or expired reset token');
    }

    // Validate new password
    const validation = this.validatePasswordStrength(newPassword);
    if (!validation.isValid) {
      throw new Error(`Password validation failed: ${validation.errors.join(', ')}`);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
        passwordChangedAt: new Date(),
        failedLoginAttempts: 0,
        accountLockedUntil: null
      }
    });

    return user;
  }
}

module.exports = SecurityService;