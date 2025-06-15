import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar, Plus, Clock, Users } from 'lucide-react';
import { useTaskStore } from '../store/taskStore';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns';
import TaskModal from './TaskModal';

const CalendarPage = () => {
  const { tasks, projects, currentProject, isLoading, error } = useTaskStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const getTasksForDate = (date: Date) => {
    return tasks.filter(task => {
      if (!task.due_date) return false;
      return isSameDay(new Date(task.due_date), date);
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done':
        return 'bg-green-500';
      case 'in-progress':
        return 'bg-blue-500';
      case 'review':
        return 'bg-yellow-500';
      case 'blocked':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  };

  const previousMonth = () => {
    setCurrentDate(prev => subMonths(prev, 1));
  };

  const nextMonth = () => {
    setCurrentDate(prev => addMonths(prev, 1));
  };

  const selectedDateTasks = selectedDate ? getTasksForDate(selectedDate) : [];

  if (error) {
    return (
      <div className="card p-12 text-center">
        <div className="text-red-600 mb-4">Error: {error}</div>
        <button 
          onClick={() => window.location.reload()} 
          className="btn-primary"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Calendar</h1>
            <p className="text-gray-600 mt-1">
              View and manage your tasks in a calendar format.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setShowTaskModal(true)}
              className="btn-primary flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Task</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-3">
            <div className="card">
              {/* Calendar Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {format(currentDate, 'MMMM yyyy')}
                  </h2>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={previousMonth}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <button
                      onClick={nextMonth}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <ChevronRight className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Days of Week */}
              <div className="grid grid-cols-7 border-b border-gray-200">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="p-4 text-center font-medium text-gray-500 text-sm">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7">
                {calendarDays.map((day, index) => {
                  const dayTasks = getTasksForDate(day);
                  const isSelected = selectedDate && isSameDay(day, selectedDate);
                  const isToday = isSameDay(day, new Date());
                  const isCurrentMonth = isSameMonth(day, currentDate);

                  return (
                    <motion.div
                      key={day.toISOString()}
                      className={`min-h-32 p-2 border-b border-r border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${
                        !isCurrentMonth ? 'bg-gray-50 text-gray-400' : ''
                      } ${isSelected ? 'bg-blue-50 border-blue-200' : ''}`}
                      onClick={() => setSelectedDate(day)}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3, delay: index * 0.01 }}
                    >
                      <div className={`text-sm font-medium mb-2 ${
                        isToday ? 'text-blue-600' : ''
                      }`}>
                        <span className={`${
                          isToday ? 'bg-blue-600 text-white px-2 py-1 rounded-full' : ''
                        }`}>
                          {format(day, 'd')}
                        </span>
                      </div>

                      <div className="space-y-1">
                        {dayTasks.slice(0, 3).map((task) => (
                          <div
                            key={task.id}
                            className={`text-xs p-1 rounded text-white truncate ${getStatusColor(task.status)}`}
                            title={task.title}
                          >
                            {task.title}
                          </div>
                        ))}
                        {dayTasks.length > 3 && (
                          <div className="text-xs text-gray-500 font-medium">
                            +{dayTasks.length - 3} more
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Selected Date Tasks */}
            <div className="card">
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
                  <Calendar className="w-5 h-5" />
                  <span>
                    {selectedDate 
                      ? format(selectedDate, 'MMM d, yyyy')
                      : 'Select a date'
                    }
                  </span>
                </h3>
              </div>

              <div className="p-4">
                {selectedDate ? (
                  selectedDateTasks.length > 0 ? (
                    <div className="space-y-3">
                      {selectedDateTasks.map((task) => (
                        <div key={task.id} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-start space-x-3">
                            <div className={`w-3 h-3 rounded-full mt-1 ${getStatusColor(task.status)}`} />
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900 text-sm">
                                {task.title}
                              </h4>
                              {task.description && (
                                <p className="text-xs text-gray-600 mt-1">
                                  {task.description}
                                </p>
                              )}
                              <div className="flex items-center space-x-2 mt-2">
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  task.status === 'done' ? 'bg-green-100 text-green-700' :
                                  task.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                                  task.status === 'blocked' ? 'bg-red-100 text-red-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>
                                  {task.status.replace('-', ' ')}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {task.priority} priority
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 text-sm">No tasks scheduled</p>
                      <button 
                        onClick={() => setShowTaskModal(true)}
                        className="btn-primary mt-3 text-sm flex items-center space-x-2 mx-auto"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Task</span>
                      </button>
                    </div>
                  )
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">Click on a date to view tasks</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="card p-4">
              <h3 className="font-semibold text-gray-900 mb-4">This Month</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm">Total Tasks</span>
                  <span className="font-medium">{tasks.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm">Completed</span>
                  <span className="font-medium text-green-600">
                    {tasks.filter(t => t.status === 'done').length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm">In Progress</span>
                  <span className="font-medium text-blue-600">
                    {tasks.filter(t => t.status === 'in-progress').length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm">Overdue</span>
                  <span className="font-medium text-red-600">
                    {tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done').length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Task Modal */}
      <TaskModal
        isOpen={showTaskModal}
        onClose={() => setShowTaskModal(false)}
        projectId={currentProject || undefined}
      />
    </>
  );
};

export default CalendarPage;