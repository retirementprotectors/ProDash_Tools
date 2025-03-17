import { Plugin } from '@/types';

export interface AuthConfig {
  providers: {
    email: {
      enabled: boolean;
      verification: boolean;
      passwordReset: boolean;
      sessionDuration: number;
    };
    google: {
      enabled: boolean;
      clientId: string;
      clientSecret: string;
      redirectUri: string;
    };
    github: {
      enabled: boolean;
      clientId: string;
      clientSecret: string;
      redirectUri: string;
    };
  };
  security: {
    passwordHash: 'bcrypt' | 'argon2';
    jwtSecret: string;
    jwtExpiry: number;
    rateLimit: {
      enabled: boolean;
      maxAttempts: number;
      windowMs: number;
    };
  };
  storage: {
    type: 'memory' | 'redis' | 'database';
    options: Record<string, any>;
  };
}

export class AuthPlugin implements Plugin {
  name = 'auth';
  version = '1.0.0';
  private config?: AuthConfig;

  configure(config: AuthConfig): void {
    this.config = {
      providers: {
        email: {
          enabled: config.providers?.email?.enabled ?? true,
          verification: config.providers?.email?.verification ?? true,
          passwordReset: config.providers?.email?.passwordReset ?? true,
          sessionDuration: config.providers?.email?.sessionDuration ?? 86400 // 24 hours
        },
        google: {
          enabled: config.providers?.google?.enabled ?? false,
          clientId: config.providers?.google?.clientId || '',
          clientSecret: config.providers?.google?.clientSecret || '',
          redirectUri: config.providers?.google?.redirectUri || ''
        },
        github: {
          enabled: config.providers?.github?.enabled ?? false,
          clientId: config.providers?.github?.clientId || '',
          clientSecret: config.providers?.github?.clientSecret || '',
          redirectUri: config.providers?.github?.redirectUri || ''
        }
      },
      security: {
        passwordHash: config.security?.passwordHash || 'bcrypt',
        jwtSecret: config.security?.jwtSecret || '',
        jwtExpiry: config.security?.jwtExpiry ?? 86400,
        rateLimit: {
          enabled: config.security?.rateLimit?.enabled ?? true,
          maxAttempts: config.security?.rateLimit?.maxAttempts ?? 5,
          windowMs: config.security?.rateLimit?.windowMs ?? 900000 // 15 minutes
        }
      },
      storage: {
        type: config.storage?.type || 'memory',
        options: config.storage?.options || {}
      }
    };
  }

  async install(): Promise<void> {
    if (!this.config) {
      throw new Error('Auth configuration not set');
    }

    await this.setupDependencies();
    await this.createAuthService();
    await this.setupStorage();
    console.log('Auth plugin installed successfully');
  }

  async uninstall(): Promise<void> {
    console.log('Auth plugin uninstalled');
  }

  private async setupDependencies(): Promise<void> {
    const dependencies = {
      'bcryptjs': '^2.4.3',
      'jsonwebtoken': '^9.0.0',
      'passport': '^0.6.0',
      'passport-local': '^1.0.0',
      ...(this.config?.providers.google.enabled && {
        'passport-google-oauth20': '^2.0.0'
      }),
      ...(this.config?.providers.github.enabled && {
        'passport-github2': '^0.1.12'
      }),
      ...(this.config?.security.rateLimit.enabled && {
        'express-rate-limit': '^6.7.0'
      }),
      ...(this.config?.storage.type === 'redis' && {
        'redis': '^4.6.7'
      }),
      'nodemailer': '^6.9.1',
      'winston': '^3.8.2'
    };

    console.log('Added Auth dependencies:', dependencies);
  }

  private async createAuthService(): Promise<void> {
    const authService = `
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { sendEmail } from './email';
import { rateLimit } from 'express-rate-limit';
import { storage } from './storage';

export class AuthService {
  private passport;
  private storage;

  constructor() {
    this.passport = new Passport();
    this.storage = storage;
    this.setupStrategies();
  }

  private setupStrategies() {
    // Local Strategy
    this.passport.use(new LocalStrategy({
      usernameField: 'email',
      passwordField: 'password'
    }, async (email, password, done) => {
      try {
        const user = await this.storage.findUserByEmail(email);
        if (!user) return done(null, false, { message: 'User not found' });
        
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) return done(null, false, { message: 'Invalid password' });
        
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }));

    ${this.config?.providers.google.enabled ? `
    // Google Strategy
    this.passport.use(new GoogleStrategy({
      clientID: '${this.config?.providers.google.clientId}',
      clientSecret: '${this.config?.providers.google.clientSecret}',
      callbackURL: '${this.config?.providers.google.redirectUri}'
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await this.storage.findUserByGoogleId(profile.id);
        if (!user) {
          user = await this.storage.createUser({
            googleId: profile.id,
            email: profile.emails[0].value,
            name: profile.displayName
          });
        }
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    });` : ''}

    ${this.config?.providers.github.enabled ? `
    // GitHub Strategy
    this.passport.use(new GitHubStrategy({
      clientID: '${this.config?.providers.github.clientId}',
      clientSecret: '${this.config?.providers.github.clientSecret}',
      callbackURL: '${this.config?.providers.github.redirectUri}'
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await this.storage.findUserByGithubId(profile.id);
        if (!user) {
          user = await this.storage.createUser({
            githubId: profile.id,
            email: profile.emails[0].value,
            name: profile.displayName
          });
        }
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    });` : ''}
  }

  async login(email: string, password: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.passport.authenticate('local', (err, user, info) => {
        if (err) reject(err);
        if (!user) reject(new Error(info.message));
        
        const token = jwt.sign(
          { id: user.id, email: user.email },
          '${this.config?.security.jwtSecret}',
          { expiresIn: ${this.config?.security.jwtExpiry} }
        );
        
        resolve(token);
      })({ body: { email, password } });
    });
  }

  async register(email: string, password: string, name: string): Promise<void> {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await this.storage.createUser({
      email,
      password: hashedPassword,
      name
    });

    ${this.config?.providers.email.verification ? `
    if (${this.config?.providers.email.verification}) {
      await sendEmail({
        to: email,
        subject: 'Verify your email',
        text: \`Click here to verify: \${process.env.APP_URL}/verify/\${user.verificationToken}\`
      });
    }` : ''}
  }

  async verifyEmail(token: string): Promise<void> {
    const user = await this.storage.findUserByVerificationToken(token);
    if (!user) throw new Error('Invalid verification token');
    
    await this.storage.updateUser(user.id, {
      verified: true,
      verificationToken: null
    });
  }

  async resetPassword(email: string): Promise<void> {
    const user = await this.storage.findUserByEmail(email);
    if (!user) throw new Error('User not found');
    
    const resetToken = jwt.sign(
      { id: user.id },
      '${this.config?.security.jwtSecret}',
      { expiresIn: '1h' }
    );
    
    await this.storage.updateUser(user.id, {
      resetToken,
      resetTokenExpiry: Date.now() + 3600000
    });

    await sendEmail({
      to: email,
      subject: 'Reset your password',
      text: \`Click here to reset: \${process.env.APP_URL}/reset/\${resetToken}\`
    });
  }

  async changePassword(token: string, newPassword: string): Promise<void> {
    const decoded = jwt.verify(token, '${this.config?.security.jwtSecret}') as { id: string };
    const user = await this.storage.findUserById(decoded.id);
    
    if (!user) throw new Error('User not found');
    if (user.resetToken !== token) throw new Error('Invalid reset token');
    if (user.resetTokenExpiry < Date.now()) throw new Error('Reset token expired');
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.storage.updateUser(user.id, {
      password: hashedPassword,
      resetToken: null,
      resetTokenExpiry: null
    });
  }
}`;

    console.log('Created Auth service');
  }

  private async setupStorage(): Promise<void> {
    const storageConfig = {
      type: this.config?.storage.type,
      options: this.config?.storage.options
    };

    console.log('Configured Auth storage:', storageConfig);
  }
}

export const authPlugin = new AuthPlugin(); 