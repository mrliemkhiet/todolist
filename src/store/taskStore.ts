import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import type { Task, Project, Subtask, TaskTag } from '../lib/supabase';

export interface TaskWithDetails extends Task {
  subtasks: Subtask[];
  tags: string[];
  assignee?: {
    id: string;
    name: string;
    avatar_url?: string;
  };
}

export interface ProjectWithDetails extends Project {
  tasks: TaskWithDetails[];
  members: {
    id: string;
    name: string;
    avatar_url?: string;
    role: string;
  }[];
}

interface TaskState {
  tasks: TaskWithDetails[];
  projects: ProjectWithDetails[];
  currentProject: string | null;
  viewMode: 'list' | 'kanban' | 'calendar' | 'gantt';
  isLoading: boolean;
  error: string | null;
  
  // Task actions
  fetchTasks: () => Promise<void>;
  addTask: (task: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  
  // Project actions
  fetchProjects: () => Promise<void>;
  addProject: (project: Omit<Project, 'id' | 'created_at' | 'updated_at' | 'owner_id'>) => Promise<void>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  setCurrentProject: (projectId: string | null) => void;
  
  // View actions
  setViewMode: (mode: 'list' | 'kanban' | 'calendar' | 'gantt') => void;
  
  // Utility actions
  clearError: () => void;
}

// Helper function to get authenticated user
const getAuthenticatedUser = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error) {
    console.error('Session error:', error);
    throw new Error('Authentication failed');
  }
  
  if (!session?.user) {
    throw new Error('Not authenticated');
  }
  
  return session.user;
};

export const useTaskStore = create<TaskState>()(
  persist(
    (set, get) => ({
      tasks: [],
      projects: [],
      currentProject: null,
      viewMode: 'list',
      isLoading: false,
      error: null,

      fetchTasks: async () => {
        set({ isLoading: true, error: null });
        
        try {
          const user = await getAuthenticatedUser();

          // First check if user has any projects, if not create a default one
          const { data: existingProjects } = await supabase
            .from('projects')
            .select('id')
            .eq('owner_id', user.id)
            .limit(1);

          if (!existingProjects || existingProjects.length === 0) {
            // Create a default project
            const { data: newProject, error: projectError } = await supabase
              .from('projects')
              .insert({
                title: 'My First Project',
                description: 'Welcome to TaskFlow! This is your first project.',
                color: '#3b82f6',
                owner_id: user.id,
              })
              .select()
              .single();

            if (!projectError && newProject) {
              // Add user as project member
              await supabase
                .from('project_members')
                .insert({
                  project_id: newProject.id,
                  user_id: user.id,
                  role: 'owner',
                });
            }
          }

          // Fetch tasks with related data
          const { data: tasksData, error: tasksError } = await supabase
            .from('tasks')
            .select(`
              *,
              subtasks (*),
              task_tags (tag),
              assignee:profiles!tasks_assignee_id_fkey (id, name, avatar_url)
            `)
            .order('created_at', { ascending: false });

          if (tasksError) {
            console.error('Tasks fetch error:', tasksError);
            // Don't throw error if it's just empty results
            if (tasksError.code !== 'PGRST116') {
              throw tasksError;
            }
          }

          // Transform the data
          const tasks: TaskWithDetails[] = (tasksData || []).map(task => ({
            ...task,
            subtasks: task.subtasks || [],
            tags: (task.task_tags || []).map((tt: any) => tt.tag),
            assignee: task.assignee || undefined,
          }));

          set({ tasks, isLoading: false });
        } catch (error: any) {
          console.error('Fetch tasks error:', error);
          set({ 
            error: error.message || 'Failed to fetch tasks', 
            isLoading: false 
          });
        }
      },

      addTask: async (taskData) => {
        set({ isLoading: true, error: null });
        
        try {
          const user = await getAuthenticatedUser();

          const { data, error } = await supabase
            .from('tasks')
            .insert({
              ...taskData,
              created_by: user.id,
            })
            .select()
            .single();

          if (error) throw error;

          // Refresh tasks
          await get().fetchTasks();
          set({ isLoading: false });
        } catch (error: any) {
          console.error('Add task error:', error);
          set({ 
            error: error.message || 'Failed to create task', 
            isLoading: false 
          });
        }
      },

      updateTask: async (id, updates) => {
        set({ isLoading: true, error: null });
        
        try {
          await getAuthenticatedUser(); // Verify authentication

          const { error } = await supabase
            .from('tasks')
            .update({
              ...updates,
              updated_at: new Date().toISOString(),
            })
            .eq('id', id);

          if (error) throw error;

          // Refresh tasks
          await get().fetchTasks();
          set({ isLoading: false });
        } catch (error: any) {
          console.error('Update task error:', error);
          set({ 
            error: error.message || 'Failed to update task', 
            isLoading: false 
          });
        }
      },

      deleteTask: async (id) => {
        set({ isLoading: true, error: null });
        
        try {
          await getAuthenticatedUser(); // Verify authentication

          const { error } = await supabase
            .from('tasks')
            .delete()
            .eq('id', id);

          if (error) throw error;

          // Refresh tasks
          await get().fetchTasks();
          set({ isLoading: false });
        } catch (error: any) {
          console.error('Delete task error:', error);
          set({ 
            error: error.message || 'Failed to delete task', 
            isLoading: false 
          });
        }
      },

      fetchProjects: async () => {
        set({ isLoading: true, error: null });
        
        try {
          const user = await getAuthenticatedUser();

          // Fetch projects with members
          const { data: projectsData, error: projectsError } = await supabase
            .from('projects')
            .select(`
              *,
              project_members (
                role,
                user:profiles (id, name, avatar_url)
              )
            `)
            .eq('owner_id', user.id)
            .order('created_at', { ascending: false });

          if (projectsError) {
            console.error('Projects fetch error:', projectsError);
            // Don't throw error if it's just empty results
            if (projectsError.code !== 'PGRST116') {
              throw projectsError;
            }
          }

          // Transform the data
          const projects: ProjectWithDetails[] = (projectsData || []).map(project => ({
            ...project,
            tasks: [], // Will be populated when tasks are fetched
            members: (project.project_members || []).map((pm: any) => ({
              ...pm.user,
              role: pm.role,
            })),
          }));

          set({ projects, isLoading: false });

          // Set default project if none selected
          if (!get().currentProject && projects.length > 0) {
            set({ currentProject: projects[0].id });
          }
        } catch (error: any) {
          console.error('Fetch projects error:', error);
          set({ 
            error: error.message || 'Failed to fetch projects', 
            isLoading: false 
          });
        }
      },

      addProject: async (projectData) => {
        set({ isLoading: true, error: null });
        
        try {
          const user = await getAuthenticatedUser();

          // Create project
          const { data: project, error: projectError } = await supabase
            .from('projects')
            .insert({
              ...projectData,
              owner_id: user.id,
            })
            .select()
            .single();

          if (projectError) throw projectError;

          // Add user as project member
          const { error: memberError } = await supabase
            .from('project_members')
            .insert({
              project_id: project.id,
              user_id: user.id,
              role: 'owner',
            });

          if (memberError) {
            console.warn('Failed to add project member:', memberError);
          }

          // Refresh projects
          await get().fetchProjects();
          set({ isLoading: false });
        } catch (error: any) {
          console.error('Add project error:', error);
          set({ 
            error: error.message || 'Failed to create project', 
            isLoading: false 
          });
        }
      },

      updateProject: async (id, updates) => {
        set({ isLoading: true, error: null });
        
        try {
          await getAuthenticatedUser(); // Verify authentication

          const { error } = await supabase
            .from('projects')
            .update({
              ...updates,
              updated_at: new Date().toISOString(),
            })
            .eq('id', id);

          if (error) throw error;

          // Refresh projects
          await get().fetchProjects();
          set({ isLoading: false });
        } catch (error: any) {
          console.error('Update project error:', error);
          set({ 
            error: error.message || 'Failed to update project', 
            isLoading: false 
          });
        }
      },

      deleteProject: async (id) => {
        set({ isLoading: true, error: null });
        
        try {
          await getAuthenticatedUser(); // Verify authentication

          const { error } = await supabase
            .from('projects')
            .delete()
            .eq('id', id);

          if (error) throw error;

          // Refresh projects
          await get().fetchProjects();
          
          // Clear current project if it was deleted
          if (get().currentProject === id) {
            set({ currentProject: null });
          }
          
          set({ isLoading: false });
        } catch (error: any) {
          console.error('Delete project error:', error);
          set({ 
            error: error.message || 'Failed to delete project', 
            isLoading: false 
          });
        }
      },

      setCurrentProject: (projectId) => {
        set({ currentProject: projectId });
      },

      setViewMode: (mode) => {
        set({ viewMode: mode });
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'task-storage',
      partialize: (state) => ({ 
        currentProject: state.currentProject,
        viewMode: state.viewMode 
      }),
    }
  )
);