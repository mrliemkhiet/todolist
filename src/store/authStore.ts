import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

interface Profile {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

interface AuthState {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  clearError: () => void;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      session: null,
      isLoading: false,
      isInitialized: false,
      error: null,

      initialize: async () => {
        try {
          // Get initial session
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('Session error:', error);
          }

          if (session?.user) {
            set({ 
              user: session.user, 
              session,
              isInitialized: true 
            });
            
            // Fetch profile
            await get().fetchProfile();
          } else {
            set({ isInitialized: true });
          }

          // Listen for auth changes
          supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('Auth state changed:', event, session?.user?.id);
            
            if (session?.user) {
              set({ 
                user: session.user, 
                session,
                error: null 
              });
              
              // Fetch profile when user signs in
              if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                await get().fetchProfile();
              }
            } else {
              set({ 
                user: null, 
                profile: null, 
                session: null,
                error: null 
              });
            }
          });
        } catch (error: any) {
          console.error('Auth initialization error:', error);
          set({ 
            error: error.message,
            isInitialized: true 
          });
        }
      },

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) {
            // Handle email not confirmed error specifically
            if (error.message.includes('Email not confirmed')) {
              throw new Error('Please confirm your email address by clicking the link in the email we sent you.');
            }
            throw error;
          }

          if (data.user) {
            set({ 
              user: data.user, 
              session: data.session,
              isLoading: false 
            });
            
            // Fetch profile
            await get().fetchProfile();
          }
        } catch (error: any) {
          console.error('Login error:', error);
          set({ 
            error: error.message || 'Login failed', 
            isLoading: false 
          });
          throw error;
        }
      },

      signup: async (email: string, password: string, name: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                name,
              },
            },
          });

          if (error) throw error;

          // For development, we'll automatically confirm the email
          // In production, users would need to confirm via email
          if (data.user && !data.user.email_confirmed_at) {
            set({ 
              error: 'Please check your email and click the confirmation link to complete your registration.',
              isLoading: false 
            });
            return;
          }

          if (data.user) {
            set({ 
              user: data.user, 
              session: data.session,
              isLoading: false 
            });
          }
        } catch (error: any) {
          console.error('Signup error:', error);
          set({ 
            error: error.message || 'Signup failed', 
            isLoading: false 
          });
          throw error;
        }
      },

      logout: async () => {
        set({ isLoading: true, error: null });
        
        try {
          const { error } = await supabase.auth.signOut();
          
          if (error) throw error;
          
          set({ 
            user: null, 
            profile: null, 
            session: null,
            isLoading: false 
          });
        } catch (error: any) {
          console.error('Logout error:', error);
          set({ 
            error: error.message || 'Logout failed', 
            isLoading: false 
          });
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
            // If profile doesn't exist, create it
            if (error.code === 'PGRST116') {
              const { data: newProfile, error: createError } = await supabase
                .from('profiles')
                .insert({
                  id: user.id,
                  email: user.email || '',
                  name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
                })
                .select()
                .single();

              if (createError) {
                console.error('Create profile error:', createError);
                return;
              }

              set({ profile: newProfile });
              return;
            }
            throw error;
          }

          set({ profile: data });
        } catch (error: any) {
          console.error('Fetch profile error:', error);
          // Don't set error state for profile fetch failures
          // as it's not critical for app functionality
        }
      },

      updateProfile: async (updates) => {
        const { user } = get();
        if (!user) return;

        set({ isLoading: true, error: null });
        
        try {
          const { data, error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', user.id)
            .select()
            .single();

          if (error) throw error;

          set({ 
            profile: data, 
            isLoading: false 
          });
        } catch (error: any) {
          console.error('Update profile error:', error);
          set({ 
            error: error.message || 'Failed to update profile', 
            isLoading: false 
          });
        }
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        // Don't persist sensitive data
      }),
    }
  )
);