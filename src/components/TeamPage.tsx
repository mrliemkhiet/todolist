import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Plus, 
  Search, 
  MoreHorizontal, 
  Mail, 
  Calendar,
  CheckCircle,
  Clock,
  UserPlus,
  Settings,
  Crown,
  Shield,
  Eye
} from 'lucide-react';
import { useTaskStore } from '../store/taskStore';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar_url?: string;
  last_active: string;
  tasks_completed: number;
  tasks_in_progress: number;
}

interface TeamActivity {
  id: string;
  user_name: string;
  action: string;
  target: string;
  created_at: string;
  type: string;
}

const TeamPage = () => {
  const { projects, tasks, currentProject } = useTaskStore();
  const { user, profile } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [teamActivity, setTeamActivity] = useState<TeamActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTeamData();
  }, [currentProject, user]);

  const fetchTeamData = async () => {
    if (!user || !currentProject) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // Fetch team members for current project
      const { data: membersData, error: membersError } = await supabase
        .from('project_members')
        .select(`
          role,
          user:profiles (
            id,
            name,
            email,
            avatar_url
          )
        `)
        .eq('project_id', currentProject);

      if (membersError) throw membersError;

      // Calculate task statistics for each member
      const membersWithStats = await Promise.all(
        (membersData || []).map(async (member: any) => {
          const userTasks = tasks.filter(task => task.assignee_id === member.user.id);
          const completedTasks = userTasks.filter(task => task.status === 'done').length;
          const inProgressTasks = userTasks.filter(task => task.status === 'in-progress').length;

          return {
            id: member.user.id,
            name: member.user.name,
            email: member.user.email,
            role: member.role,
            avatar_url: member.user.avatar_url,
            last_active: '2 hours ago', // This would come from a real activity tracking system
            tasks_completed: completedTasks,
            tasks_in_progress: inProgressTasks,
          };
        })
      );

      setTeamMembers(membersWithStats);

      // Fetch team activity
      const { data: activityData, error: activityError } = await supabase
        .from('team_activity')
        .select(`
          *,
          user:profiles (name)
        `)
        .eq('project_id', currentProject)
        .order('created_at', { ascending: false })
        .limit(10);

      if (activityError) throw activityError;

      const formattedActivity = (activityData || []).map((activity: any) => ({
        id: activity.id,
        user_name: activity.user.name,
        action: activity.action,
        target: activity.target,
        created_at: activity.created_at,
        type: activity.action.includes('completed') ? 'completed' :
              activity.action.includes('created') ? 'created' :
              activity.action.includes('commented') ? 'commented' : 'updated'
      }));

      setTeamActivity(formattedActivity);
    } catch (error) {
      console.error('Error fetching team data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="w-4 h-4 text-yellow-600" />;
      case 'admin':
        return <Shield className="w-4 h-4 text-blue-600" />;
      case 'member':
        return <Users className="w-4 h-4 text-green-600" />;
      case 'viewer':
        return <Eye className="w-4 h-4 text-gray-600" />;
      default:
        return <Users className="w-4 h-4 text-gray-600" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-yellow-100 text-yellow-700';
      case 'admin':
        return 'bg-blue-100 text-blue-700';
      case 'member':
        return 'bg-green-100 text-green-700';
      case 'viewer':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hour${Math.floor(diffInMinutes / 60) > 1 ? 's' : ''} ago`;
    return `${Math.floor(diffInMinutes / 1440)} day${Math.floor(diffInMinutes / 1440) > 1 ? 's' : ''} ago`;
  };

  const filteredMembers = teamMembers.filter(member =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentProjectData = projects.find(p => p.id === currentProject);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Team</h1>
            <p className="text-gray-600 mt-1">
              Manage team members and their roles in {currentProjectData?.title || 'your workspace'}.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setShowInviteModal(true)}
              className="btn-primary flex items-center space-x-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>Invite Member</span>
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="card p-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search team members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-64 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-center space-x-3">
              <select className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option>All Roles</option>
                <option>Owner</option>
                <option>Admin</option>
                <option>Member</option>
                <option>Viewer</option>
              </select>
            </div>
          </div>
        </div>

        {/* Team Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { label: 'Total Members', value: teamMembers.length, color: 'blue' },
            { label: 'Active Today', value: teamMembers.filter(m => m.last_active.includes('hour')).length, color: 'green' },
            { label: 'Tasks Completed', value: teamMembers.reduce((sum, member) => sum + member.tasks_completed, 0), color: 'purple' },
            { label: 'Tasks In Progress', value: teamMembers.reduce((sum, member) => sum + member.tasks_in_progress, 0), color: 'orange' },
          ].map((stat, index) => (
            <motion.div
              key={index}
              className="card p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className={`text-2xl font-bold text-${stat.color}-600 mb-1`}>
                {stat.value}
              </div>
              <div className="text-gray-600 text-sm">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Team Members List */}
        <div className="card">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Team Members</h2>
          </div>

          <div className="divide-y divide-gray-200">
            {filteredMembers.map((member, index) => (
              <motion.div
                key={member.id}
                className="px-6 py-4 hover:bg-gray-50 transition-colors"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <img 
                      src={member.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.email}`} 
                      alt={member.name}
                      className="w-12 h-12 rounded-full"
                    />
                    <div>
                      <h3 className="font-medium text-gray-900">{member.name}</h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <Mail className="w-3 h-3 text-gray-400" />
                        <span className="text-sm text-gray-500">{member.email}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <div className="text-sm font-medium text-gray-900">{member.tasks_completed}</div>
                      <div className="text-xs text-gray-500">Completed</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-sm font-medium text-gray-900">{member.tasks_in_progress}</div>
                      <div className="text-xs text-gray-500">In Progress</div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {getRoleIcon(member.role)}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(member.role)}`}>
                        {member.role}
                      </span>
                    </div>

                    <div className="text-right">
                      <div className="text-sm text-gray-500">Last active</div>
                      <div className="text-xs text-gray-400">{member.last_active}</div>
                    </div>

                    <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                      <MoreHorizontal className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Team Activity */}
        <div className="card">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
          </div>

          <div className="p-6">
            <div className="space-y-4">
              {teamActivity.length > 0 ? (
                teamActivity.map((activity, index) => (
                  <div key={activity.id} className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${
                      activity.type === 'completed' ? 'bg-green-500' :
                      activity.type === 'created' ? 'bg-blue-500' :
                      activity.type === 'commented' ? 'bg-yellow-500' :
                      'bg-purple-500'
                    }`} />
                    <div className="flex-1">
                      <span className="font-medium text-gray-900">{activity.user_name}</span>
                      <span className="text-gray-600"> {activity.action} </span>
                      <span className="font-medium text-gray-900">{activity.target}</span>
                    </div>
                    <span className="text-sm text-gray-500">{formatTimeAgo(activity.created_at)}</span>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-8">
                  No recent activity to display
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            className="bg-white rounded-xl shadow-xl max-w-md w-full"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Invite Team Member</h2>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  className="input focus-ring"
                  placeholder="Enter email address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <select className="input focus-ring">
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message (Optional)
                </label>
                <textarea
                  className="input focus-ring resize-none"
                  rows={3}
                  placeholder="Add a personal message..."
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowInviteModal(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button className="btn-primary">
                Send Invitation
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
};

export default TeamPage;