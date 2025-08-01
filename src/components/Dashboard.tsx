import React from 'react';
import { Users, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { useData } from '../contexts/DataContext';

interface DashboardProps {
  onNavigateToLeads: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigateToLeads }) => {
  const { leads } = useData();

  const stats = [
    {
      title: 'Total Leads',
      value: leads.length,
      change: '+12%',
      changeType: 'positive' as const,
      icon: Users,
      color: 'blue'
    },
    {
      title: 'Qualified Leads',
      value: leads.filter(l => l.status === 'Qualified').length,
      change: '+8%',
      changeType: 'positive' as const,
      icon: CheckCircle,
      color: 'green'
    },
    {
      title: 'Active Deals',
      value: leads.filter(l => ['Contacted', 'Qualified'].includes(l.status)).length,
      change: '+15%',
      changeType: 'positive' as const,
      icon: TrendingUp,
      color: 'purple'
    },
    {
      title: 'Follow-ups Due',
      value: 5,
      change: '-3%',
      changeType: 'negative' as const,
      icon: Clock,
      color: 'orange'
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-50 text-blue-700 border-blue-200',
      green: 'bg-green-50 text-green-700 border-green-200',
      purple: 'bg-purple-50 text-purple-700 border-purple-200',
      orange: 'bg-orange-50 text-orange-700 border-orange-200'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's what's happening with your leads.</p>
        </div>
        <button
          onClick={onNavigateToLeads}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          View All Leads
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-200 cursor-pointer"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-lg border ${getColorClasses(stat.color)}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className={`text-sm font-medium ${
                  stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.change}
                </span>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-gray-600 text-sm mt-1">{stat.title}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {[
              { action: 'New lead created', lead: 'Mohammed Yousuf', time: '2 hours ago', status: 'new' },
              { action: 'Lead qualified', lead: 'Aarav Sinha', time: '4 hours ago', status: 'qualified' },
              { action: 'Contact added', lead: 'Priya Sharma', time: '6 hours ago', status: 'contact' },
              { action: 'Meeting scheduled', lead: 'Mohammed Yousuf', time: '1 day ago', status: 'meeting' }
            ].map((activity, index) => (
              <div key={index} className="flex items-center space-x-4 p-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer">
                <div className={`w-2 h-2 rounded-full ${
                  activity.status === 'new' ? 'bg-blue-500' :
                  activity.status === 'qualified' ? 'bg-green-500' :
                  activity.status === 'contact' ? 'bg-purple-500' : 'bg-orange-500'
                }`}></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                  <p className="text-sm text-gray-600">{activity.lead}</p>
                </div>
                <span className="text-xs text-gray-500">{activity.time}</span>
              </div>
            ))}
          </div>
          <div className="p-4">
            <button 
              onClick={onNavigateToLeads}
              className="w-full text-center text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              View all activity
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Pipeline Overview</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Prospect</span>
              <span className="text-sm text-gray-600">1 lead</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: '33%' }}></div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Qualified</span>
              <span className="text-sm text-gray-600">2 leads</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-600 h-2 rounded-full" style={{ width: '67%' }}></div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Demo</span>
              <span className="text-sm text-gray-600">0 leads</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-purple-600 h-2 rounded-full" style={{ width: '0%' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};