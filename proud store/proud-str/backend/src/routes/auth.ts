import express, { Request, Response } from 'express';
import { supabase } from '../supabaseClient.js';
import { AuthenticatedRequest, authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// User Registration
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, fullName } = req.body;

    if (!email || !password || !fullName) {
      return res.status(400).json({ error: 'Email, password, and full name are required' });
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName
        }
      }
    });

    if (authError) {
      return res.status(400).json({ error: authError.message });
    }

    if (!authData.user) {
      return res.status(400).json({ error: 'Failed to create user' });
    }

    // Create user profile in public.users table
    const { error: profileError } = await supabase
      .from('users')
      .insert([
        {
          id: authData.user.id,
          email: authData.user.email,
          full_name: fullName,
          role: 'user'
        }
      ]);

    if (profileError) {
      console.error('Profile creation error:', profileError);
    }

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        full_name: fullName
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// User Login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return res.status(401).json({ error: error.message });
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
    }

    res.json({
      message: 'Login successful',
      user: {
        id: data.user.id,
        email: data.user.email,
        full_name: profile?.full_name,
        role: profile?.role || 'user'
      },
      session: data.session
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin Login
router.post('/admin-login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Fixed admin credentials
    const ADMIN_EMAIL = 'proudchannel2024@gmail.com';
    const ADMIN_PASSWORD = 'lolinr123';

    if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }

    // Try to sign in with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      // If admin doesn't exist in Supabase, create them
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: 'Admin User'
          }
        }
      });

      if (signUpError) {
        return res.status(500).json({ error: 'Failed to create admin user' });
      }

      // Create admin profile
      if (signUpData.user) {
        await supabase
          .from('users')
          .insert([
            {
              id: signUpData.user.id,
              email: signUpData.user.email,
              full_name: 'Admin User',
              role: 'admin'
            }
          ]);

        return res.json({
          message: 'Admin login successful',
          user: {
            id: signUpData.user.id,
            email: signUpData.user.email,
            full_name: 'Admin User',
            role: 'admin'
          },
          session: signUpData.session
        });
      }
    }

    // Update user role to admin if exists
    if (data?.user) {
      await supabase
        .from('users')
        .upsert([
          {
            id: data.user.id,
            email: data.user.email,
            full_name: 'Admin User',
            role: 'admin'
          }
        ]);

      res.json({
        message: 'Admin login successful',
        user: {
          id: data.user.id,
          email: data.user.email,
          full_name: 'Admin User',
          role: 'admin'
        },
        session: data.session
      });
    }
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user
router.get('/me', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { data: profile, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user!.id)
      .single();

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch user profile' });
    }

    res.json({
      user: {
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        role: profile.role
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Logout
router.post('/logout', async (req: Request, res: Response) => {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Password reset
router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'Password reset email sent' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
