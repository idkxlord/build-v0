import React, { useState, useEffect } from 'react';
import { ArrowLeft, Edit, Phone, Mail, Calendar, Plus, User, MessageSquare, Clock } from 'lucide-react';
import { useLeadData } from '../contexts/LeadDataContext';
import LeadForm from './LeadForm';
import ContactForm from './ContactForm';
import ContactList from './ContactList';

const LeadDetail = ({ leadId, onBack }) => {
  const { fetchLeadById, hasPermission, loading, error } = useLeadData();
  const [lead, setLead] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [showEditForm, setShowEditForm] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);
  const [notes, setNotes] = useState('');
  const [newNote, setNewNote] = useState('');

  // Mock data for users (in real app, this would come from context)
  const users = [
    { id: 'e8a1d4a6-6e0c-4b5b-b684-1ba87d09a1c2', name: 'John Smith', role: 'Manager' },
    { id: 'f9b2e5c7-7f1d-4c6c-c795-2cb98e10b2d3', name: 'Sarah Johnson', role: 'Sales Rep' },
    { id: 'a3c4f6d8-8g2e-4d7d-d8a6-3dc09f21c3e4', name: 'Mike Wilson', role: 'Sales Rep' },
    { id: 'b4d5g7e9-9h3f-4e8e-e9b7-4ed10g32d4f5', name: 'Emma Davis', role: 'Admin' }
  ];

  const pipelines = [
    { id: 'c5e6h8f0-0i4g-4f9f-f0c8-5fe21h43e5g6', name: 'Sales Pipeline' },
    { id: 'd6f7i9g1-1j5h-4g0g-g1d9-6gf32i54f6h7', name: 'Marketing Pipeline' }
  ];

  // Load lead data
  useEffect(() => {
    const loadLead = async () => {
      if (leadId) {
        const leadData = await fetchLeadById(leadId);
        setLead(leadData);
      }
    };
    loadLead();
  }, [leadId, fetchLeadById]);

  if (loading) {
    return (
      <div className="p-6">
        <button
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Leads
        </button>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading lead...</span>
        </div>
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="p-6">
        <button
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Leads
        </button>
        <div className="text-center py-12">
          <p className="text-gray-500">{error || 'Lead not found'}</p>
        </div>
      </div>
    );
  }

  const getUserName = (userId) => {
    return users.find(user => user.id === userId)?.name || 'Unknown';
  };

  const getPipelineName = (pipelineId) => {
    return pipelines.find(p => p.id === pipelineId)?.name || 'Unknown';
  };

  const getStatusColor = (status) => {
    const colors = {
      'New': 'bg-blue-100 text-blue-800 border-blue-200',
      'Contacted': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Qualified': 'bg-green-100 text-green-800 border-green-200',
      'Lost': 'bg-red-100 text-red-800 border-red-200',
      'Won': 'bg-purple-100 text-purple-800 border-purple-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'contacts', label: 'Contacts' },
    { id: 'notes', label: 'Notes (3)' },
    { id: 'activity', label: 'Activity' }
  ];

  const handleCall = () => {
    window.open(`tel:${lead.phone}`, '_self');
  };

  const handleEmail = () => {
    window.open(`mailto:${lead.email}`, '_self');
  };

  const handleScheduleMeeting = () => {
    // In a real app, this would open a calendar integration
    alert('Calendar integration would open here');
  };

  const addNote = () => {
    if (newNote.trim()) {
      // In a real app, this would save to the database
      setNotes(prev => prev + (prev ? '\n\n' : '') + `${new Date().toLocaleDateString()}: ${newNote}`);
      setNewNote('');
    }
  };

  const handleFormSave = async () => {
    setShowEditForm(false);
    setShowAddContact(false);
    // Reload lead data
    const updatedLead = await fetchLeadById(leadId);
    setLead(updatedLead);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Leads
        </button>
        {hasPermission('edit', lead) && (
          <button
            onClick={() => setShowEditForm(true)}
            className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit Lead
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{lead.name}</h1>
              <div className="flex items-center space-x-6 text-sm text-gray-600 mb-4">
                <div className="flex items-center">
                  <Mail className="w-4 h-4 mr-2" />
                  {lead.email}
                </div>
                <div className="flex items-center">
                  <Phone className="w-4 h-4 mr-2" />
                  {lead.phone}
                </div>
                <div className="flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  {getUserName(lead.assigned_to)}
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full border ${getStatusColor(lead.status)}`}>
                  {lead.status}
                </span>
                <span className="text-sm text-gray-500">
                  Created on {new Date(lead.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Lead Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Industry</label>
                    <p className="text-gray-900">{lead.custom_fields?.industry || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Source</label>
                    <p className="text-gray-900">{lead.custom_fields?.source || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Budget</label>
                    <p className="text-gray-900">{lead.custom_fields?.budget || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Last Updated</label>
                    <p className="text-gray-900">{new Date(lead.updated_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button 
                    onClick={handleCall}
                    className="w-full flex items-center justify-center px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Call Lead
                  </button>
                  <button 
                    onClick={handleEmail}
                    className="w-full flex items-center justify-center px-4 py-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Send Email
                  </button>
                  <button 
                    onClick={handleScheduleMeeting}
                    className="w-full flex items-center justify-center px-4 py-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Schedule Meeting
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'contacts' && (
            <ContactList leadId={leadId} />
          )}

          {activeTab === 'notes' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Notes</h3>
              </div>
              
              <div className="space-y-4 mb-6">
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">Follow-up required</span>
                    <span className="text-xs text-gray-500">Jan 5, 2025</span>
                  </div>
                  <p className="text-sm text-gray-700">Lead showed strong interest in our enterprise package. Schedule demo for next week.</p>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">Initial contact</span>
                    <span className="text-xs text-gray-500">Jan 3, 2025</span>
                  </div>
                  <p className="text-sm text-gray-700">First conversation went well. Lead is evaluating multiple solutions. Budget confirmed at $50k.</p>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">Lead created</span>
                    <span className="text-xs text-gray-500">Jan 1, 2025</span>
                  </div>
                  <p className="text-sm text-gray-700">Lead came through LinkedIn campaign. High-quality prospect in retail industry.</p>
                </div>
              </div>
              
              {hasPermission('edit', lead) && (
                <div className="border-t border-gray-200 pt-6">
                  <h4 className="text-md font-medium text-gray-900 mb-3">Add New Note</h4>
                  <div className="space-y-3">
                    <textarea
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      rows={3}
                      placeholder="Add a note about this lead..."
                    />
                    <button
                      onClick={addNote}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center"
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Add Note
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'activity' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Timeline</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Follow-up scheduled</p>
                    <p className="text-xs text-gray-500">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Email sent</p>
                    <p className="text-xs text-gray-500">1 day ago</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Lead created</p>
                    <p className="text-xs text-gray-500">{new Date(lead.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                {lead.created_at !== lead.updated_at && (
                  <div className="flex items-start space-x-4">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Lead updated</p>
                      <p className="text-xs text-gray-500">{new Date(lead.updated_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {showEditForm && hasPermission('edit', lead) && (
        <LeadForm
          leadId={leadId}
          onClose={() => setShowEditForm(false)}
          onSave={handleFormSave}
        />
      )}

      {showAddContact && hasPermission('edit', lead) && (
        <ContactForm
          leadId={leadId}
          onClose={() => setShowAddContact(false)}
          onSave={handleFormSave}
        />
      )}
    </div>
  );
};

export default LeadDetail;