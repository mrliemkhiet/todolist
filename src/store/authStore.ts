import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';
import type { Profile } from '../lib/supabase';

interface AuthState {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  clearError: () => void;
  fetchProfile: () => Promise<void>;
  initialize: () => Promise<void>;
}

// Email validation regex
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      isLoading: false,
      isInitialized: false,
      error: null,

      initialize: async () => {
        set({ isLoading: true });
        
        try {
          // Get the current session
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('Session initialization error:', error);
            set({ isInitialized: true, isLoading: false });
            return;
          }

          if (session?.user) {
            set({ user: session.user });
            await get().fetchProfile();
          }
          
          set({ isInitialized: true, isLoading: false });
        } catch (error: any) {
          console.error('Auth initialization error:', error);
          set({ 
            error: error.message || 'Failed to initialize authentication',
            isInitialized: true,
            isLoading: false 
          });
        }
      },

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: email.trim().toLowerCase(),
            password,
          });

          if (error) {
            // Handle specific error cases
            if (error.message.includes('Email not confirmed')) {
              throw new Error('Please confirm your email address by clicking the link in the email we sent you.');
            }
            throw new Error(error.message);
          }

          if (data.user) {
            set({ user: data.user });
            await get().fetchProfile();
          }
          
          set({ isLoading: false });
        } catch (error: any) {
          console.error('Login error:', error);
          set({ 
            error: error.message || 'Login failed. Please check your credentials.', 
            isLoading: false 
          });
        }
      },

      signup: async (name: string, email: string, password: string) => {
        set({ isLoading: true, error: null });
        
        try {
          // Validate inputs
          if (!name.trim()) {
            throw new Error('Name is required');
          }
          if (!email.trim()) {
            throw new Error('Email is required');
          }
          if (!isValidEmail(email.trim())) {
            throw new Error('Please enter a valid email address');
          }
          if (password.length < 6) {
            throw new Error('Password must be at least 6 characters');
          }

          const { data, error } = await supabase.auth.signUp({
            email: email.trim().toLowerCase(),
            password,
            options: {
              data: {
                name: name.trim(),
                full_name: name.trim(),
              },
              emailRedirectTo: window.location.origin,
            },
          });

          if (error) {
            // Handle specific error cases
            if (error.message.includes('email_address_invalid')) {
              throw new Error('Please enter a valid email address');
            }
            throw new Error(error.message);
          }

          if (data.user) {
            set({ user: data.user });
            
            // Wait longer for the trigger to create the profile
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Try to fetch the profile, create it manually if it doesn't exist
            try {
              await get().fetchProfile();
            } catch (profileError) {
              console.warn('Profile not found, creating manually:', profileError);
              
              // Create profile manually if trigger failed
              const { error: profileCreateError } = await supabase
                .from('profiles')
                .insert({
                  id: data.user.id,
                  email: data.user.email!,
                  name: name.trim(),
                });
              
              if (profileCreateError) {
                console.warn('Manual profile creation failed:', profileCreateError);
              } else {
                // Wait a bit more and try to fetch again
                await new Promise(resolve => setTimeout(resolve, 1000));
                await get().fetchProfile();
              }
            }
          }
          
          set({ isLoading: false });
        } catch (error: any) {
          console.error('Signup error:', error);
          set({ 
            error: error.message || 'Signup failed. Please try again.', 
            isLoading: false 
          });
        }
      },

      updatePassword: async (currentPassword: string, newPassword: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const { user } = get();
          if (!user) {
            throw new Error('Not authenticated');
          }

          // First verify current password by attempting to sign in
          const { error: verifyError } = await supabase.auth.signInWithPassword({
            email: user.email!,
            password: currentPassword,
          });

          if (verifyError) {
            throw new Error('Current password is incorrect');
          }

          // Update password
          const { error } = await supabase.auth.updateUser({
            password: newPassword
          });

          if (error) {
            throw error;
          }

          set({ isLoading: false });
          alert('Password updated successfully!');
        } catch (error: any) {
          console.error('Password update error:', error);
          set({ 
            error: error.message || 'Failed to update password', 
            isLoading: false 
          });
        }
      },

      logout: async () => {
        try {
          await supabase.auth.signOut();
          set({ user: null, profile: null, error: null });
        } catch (error: any) {
          console.error('Logout error:', error);
          set({ error: error.message || 'Logout failed' });
        }
      },

      fetchProfile: async () => {
        const { user } = get();
        if (!user) return;

        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (error) {
            if (error.code === 'PGRST116') {
              // Profile doesn't exist, this is expected for new users
              console.log('Profile not found for user:', user.id);
              return;
            }
            throw error;
          }

          set({ profile: data });
        } catch (error: any) {
          console.error('Error fetching profile:', error);
          // Don't set error state for profile fetch failures
        }
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user,
        profile: state.profile 
      }),
    }
  )
);

// Initialize auth state and handle auth changes
let isInitializing = false;

const initializeAuth = async () => {
  if (isInitializing) return;
  isInitializing = true;
  
  try {
    await useAuthStore.getState().initialize();
  } finally {
    isInitializing = false;
  }
};

// Set up auth state change listener
supabase.auth.onAuthStateChange(async (event, session) => {
  const { fetchProfile } = useAuthStore.getState();
  
  console.log('Auth state change:', event, session?.user?.id);
  
  if (event === 'SIGNED_IN' && session?.user) {
    useAuthStore.setState({ 
      user: session.user, 
      isInitialized: true,
      error: null 
    });
    await fetchProfile();
  } else if (event === 'SIGNED_OUT') {
    useAuthStore.setState({ 
      user: null, 
      profile: null, 
      isInitialized: true,
      error: null 
    });
  } else if (event === 'TOKEN_REFRESHED' && session?.user) {
    useAuthStore.setState({ 
      user: session.user,
      error: null 
    });
  }
});

// Initialize on module load
initializeAuth();