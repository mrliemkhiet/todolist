import React, { useState } from 'react';
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

const TeamPage = () => {
  const { projects, tasks, currentProject } = useTaskStore();
  const { user, profile } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Mock team members data (in a real app, this would come from the database)
  const teamMembers = [
    {
      id: '1',
      name: 'Nguyễn Xuân Lĩnh',
      email: 'linh@taskflow.com',
      role: 'owner',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=NguyenXuanLinh&backgroundColor=b6e3f4&topType=ShortHairShortFlat&accessoriesType=Prescription02&hairColor=BrownDark&facialHairType=Blank&clotheType=Hoodie&clotheColor=Blue03&eyeType=Default&eyebrowType=Default&mouthType=Default&skinColor=Light',
      lastActive: '2 hours ago',
      tasksCompleted: 15,
      tasksInProgress: 3
    },
    {
      id: '2',
      name: 'Trần Khánh',
      email: 'khanh@taskflow.com',
      role: 'admin',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=TranKhanh&backgroundColor=c0aede&topType=ShortHairShortWaved&accessoriesType=Blank&hairColor=Black&facialHairType=Blank&clotheType=BlazerShirt&clotheColor=Blue01&eyeType=Default&eyebrowType=Default&mouthType=Default&skinColor=Light',
      lastActive: '1 day ago',
      tasksCompleted: 12,
      tasksInProgress: 5
    },
    {
      id: '3',
      name: 'Ngô Lập',
      email: 'lap@taskflow.com',
      role: 'member',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=NgoLap&backgroundColor=ffd93d&topType=ShortHairDreads01&accessoriesType=Blank&hairColor=BrownDark&facialHairType=Blank&clotheType=ShirtCrewNeck&clotheColor=Gray01&eyeType=Default&eyebrowType=Default&mouthType=Default&skinColor=Light',
      lastActive: '3 hours ago',
      tasksCompleted: 8,
      tasksInProgress: 2
    },
    {
      id: '4',
      name: 'Ngô Nhân',
      email: 'nhan@taskflow.com',
      role: 'member',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=NgoNhan&backgroundColor=ffdfbf&topType=ShortHairTheCaesar&accessoriesType=Blank&hairColor=Brown&facialHairType=Blank&clotheType=CollarSweater&clotheColor=Blue02&eyeType=Default&eyebrowType=Default&mouthType=Default&skinColor=Light',
      lastActive: '5 hours ago',
      tasksCompleted: 10,
      tasksInProgress: 4
    }
  ];

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

  const filteredMembers = teamMembers.filter(member =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentProjectData = projects.find(p => p.id === currentProject);

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
            { label: 'Active Today', value: 3, color: 'green' },
            { label: 'Tasks Completed', value: teamMembers.reduce((sum, member) => sum + member.tasksCompleted, 0), color: 'purple' },
            { label: 'Tasks In Progress', value: teamMembers.reduce((sum, member) => sum + member.tasksInProgress, 0), color: 'orange' },
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
                      src={member.avatar} 
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
                      <div className="text-sm font-medium text-gray-900">{member.tasksCompleted}</div>
                      <div className="text-xs text-gray-500">Completed</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-sm font-medium text-gray-900">{member.tasksInProgress}</div>
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
                      <div className="text-xs text-gray-400">{member.lastActive}</div>
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
              {[
                {
                  user: 'Nguyễn Xuân Lĩnh',
                  action: 'completed task',
                  target: 'Design system documentation',
                  time: '2 hours ago',
                  type: 'completed'
                },
                {
                  user: 'Trần Khánh',
                  action: 'created task',
                  target: 'API endpoint testing',
                  time: '4 hours ago',
                  type: 'created'
                },
                {
                  user: 'Ngô Lập',
                  action: 'commented on',
                  target: 'User interface mockups',
                  time: '6 hours ago',
                  type: 'commented'
                },
                {
                  user: 'Ngô Nhân',
                  action: 'updated task',
                  target: 'Database optimization',
                  time: '1 day ago',
                  type: 'updated'
                }
              ].map((activity, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.type === 'completed' ? 'bg-green-500' :
                    activity.type === 'created' ? 'bg-blue-500' :
                    activity.type === 'commented' ? 'bg-yellow-500' :
                    'bg-purple-500'
                  }`} />
                  <div className="flex-1">
                    <span className="font-medium text-gray-900">{activity.user}</span>
                    <span className="text-gray-600"> {activity.action} </span>
                    <span className="font-medium text-gray-900">{activity.target}</span>
                  </div>
                  <span className="text-sm text-gray-500">{activity.time}</span>
                </div>
              ))}
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