import React, { useState } from 'react';
import { BarChart3, TrendingUp, Users, Target, Calendar, Filter, Download } from 'lucide-react';
import { useData } from '../contexts/DataContext';

export const Analytics: React.FC = () => {
  const { leads, users } = useData();
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedMetric, setSelectedMetric] = useState('leads');

  const totalLeads = leads.length;
  const qualifiedLeads = leads.filter(l => l.status === 'Qualified').length;
  const wonLeads = leads.filter(l => l.status === 'Won').length;
  const conversionRate = totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(1) : '0';

  const leadsByStatus = {
    'New': leads.filter(l => l.status === 'New').length,
    'Contacted': leads.filter(l => l.status === 'Contacted').length,
    'Qualified': leads.filter(l => l.status === 'Qualified').length,
    'Won': leads.filter(l => l.status === 'Won').length,
    'Lost': leads.filter(l => l.status === 'Lost').length,
  };

  const leadsByUser = users.map(user => ({
    name: user.name,
    leads: leads.filter(l => l.assignedTo === user.id).length,
    qualified: leads.filter(l => l.assignedTo === user.id && l.status === 'Qualified').length,
  }));

  const industryData = leads.reduce((acc, lead) => {
    const industry = lead.customFields.Industry || 'Unknown';
    acc[industry] = (acc[industry] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sourceData = leads.reduce((acc, lead) => {
    const source = lead.customFields.Source || 'Unknown';
    acc[source] = (acc[source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 mt-1">Track your sales performance and lead metrics</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <button className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-lg border bg-blue-50 text-blue-700 border-blue-200">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium text-green-600">+12%</span>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{totalLeads}</p>
            <p className="text-gray-600 text-sm mt-1">Total Leads</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-lg border bg-green-50 text-green-700 border-green-200">
              <Target className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium text-green-600">+8%</span>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{qualifiedLeads}</p>
            <p className="text-gray-600 text-sm mt-1">Qualified Leads</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-lg border bg-purple-50 text-purple-700 border-purple-200">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium text-green-600">+15%</span>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{conversionRate}%</p>
            <p className="text-gray-600 text-sm mt-1">Conversion Rate</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-lg border bg-orange-50 text-orange-700 border-orange-200">
              <Calendar className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium text-red-600">-3%</span>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">5</p>
            <p className="text-gray-600 text-sm mt-1">Follow-ups Due</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lead Status Distribution */}
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Lead Status Distribution</h3>
          <div className="space-y-4">
            {Object.entries(leadsByStatus).map(([status, count]) => {
              const percentage = totalLeads > 0 ? (count / totalLeads) * 100 : 0;
              const colors = {
                'New': 'bg-blue-500',
                'Contacted': 'bg-yellow-500',
                'Qualified': 'bg-green-500',
                'Won': 'bg-purple-500',
                'Lost': 'bg-red-500'
              };
              
              return (
                <div key={status}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">{status}</span>
                    <span className="text-sm text-gray-600">{count} leads ({percentage.toFixed(0)}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${colors[status as keyof typeof colors]}`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Performance by User */}
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance by User</h3>
          <div className="space-y-4">
            {leadsByUser.map((user) => (
              <div key={user.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{user.name}</p>
                  <p className="text-sm text-gray-600">{user.leads} total leads</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-600">{user.qualified}</p>
                  <p className="text-xs text-gray-500">qualified</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Lead Sources */}
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Lead Sources</h3>
          <div className="space-y-3">
            {Object.entries(sourceData).map(([source, count]) => {
              const percentage = totalLeads > 0 ? (count / totalLeads) * 100 : 0;
              return (
                <div key={source} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{source}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600 w-8">{count}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Industry Breakdown */}
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Industry Breakdown</h3>
          <div className="space-y-3">
            {Object.entries(industryData).map(([industry, count]) => {
              const percentage = totalLeads > 0 ? (count / totalLeads) * 100 : 0;
              return (
                <div key={industry} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{industry}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-500 h-2 rounded-full"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600 w-8">{count}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Trends */}
      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Trends</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 mb-2">+23%</div>
            <p className="text-sm text-gray-600">Lead generation vs last month</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 mb-2">+15%</div>
            <p className="text-sm text-gray-600">Qualification rate improvement</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 mb-2">-12%</div>
            <p className="text-sm text-gray-600">Average response time</p>
          </div>
        </div>
      </div>
    </div>
  );
};