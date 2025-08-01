import React, { useState } from 'react';
import { ArrowLeft, Edit, Phone, Mail, Calendar, Plus, User, MessageSquare, Clock } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { LeadForm } from './LeadForm';
import { ContactForm } from './ContactForm';

interface LeadDetailProps {
  leadId: string;
  onBack: () => void;
}

export const LeadDetail: React.FC<LeadDetailProps> = ({ leadId, onBack }) => {
  const { getLeadById, getContactsByLeadId, users } = useData();
  const [activeTab, setActiveTab] = useState('overview');
  const [showEditForm, setShowEditForm] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);
  const [notes, setNotes] = useState('');
  const [newNote, setNewNote] = useState('');

  const lead = getLeadById(leadId);
  const contacts = getContactsByLeadId(leadId);

  if (!lead) {
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
          <p className="text-gray-500">Lead not found</p>
        </div>
      </div>
    );
  }

  const getUserName = (userId: string) => {
    return users.find(user => user.id === userId)?.name || 'Unknown';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'New': 'bg-blue-100 text-blue-800',
      'Contacted': 'bg-yellow-100 text-yellow-800',
      'Qualified': 'bg-green-100 text-green-800',
      'Lost': 'bg-red-100 text-red-800',
      'Won': 'bg-purple-100 text-purple-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'contacts', label: `Contacts (${contacts.length})` },
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
        <button
          onClick={() => setShowEditForm(true)}
          className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Edit className="w-4 h-4 mr-2" />
          Edit Lead
        </button>
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
                  {getUserName(lead.assignedTo)}
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(lead.status)}`}>
                  {lead.status}
                </span>
                <span className="text-sm text-gray-500">
                  Created on {lead.createdAt.toLocaleDateString()}
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
                    <p className="text-gray-900">{lead.customFields.Industry || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Source</label>
                    <p className="text-gray-900">{lead.customFields.Source || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Budget</label>
                    <p className="text-gray-900">{lead.customFields.Budget || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Last Updated</label>
                    <p className="text-gray-900">{lead.updatedAt.toLocaleDateString()}</p>
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
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Contacts</h3>
                <button
                  onClick={() => setShowAddContact(true)}
                  className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Contact
                </button>
              </div>
              
              <div className="space-y-4">
                {contacts.map((contact) => (
                  <div key={contact.id} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">{contact.name}</h4>
                        <p className="text-sm text-gray-600">{contact.designation}</p>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                          <div className="flex items-center">
                            <Mail className="w-3 h-3 mr-1" />
                            {contact.email}
                          </div>
                          <div className="flex items-center">
                            <Phone className="w-3 h-3 mr-1" />
                            {contact.phone}
                          </div>
                        </div>
                        {contact.notes && (
                          <p className="text-sm text-gray-600 mt-2">{contact.notes}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {contacts.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <User className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No contacts added yet</p>
                    <button
                      onClick={() => setShowAddContact(true)}
                      className="mt-2 text-blue-600 hover:text-blue-700"
                    >
                      Add the first contact
                    </button>
                  </div>
                )}
              </div>
            </div>
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
                    <p className="text-xs text-gray-500">{lead.createdAt.toLocaleDateString()}</p>
                  </div>
                </div>
                {lead.createdAt.getTime() !== lead.updatedAt.getTime() && (
                  <div className="flex items-start space-x-4">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Lead updated</p>
                      <p className="text-xs text-gray-500">{lead.updatedAt.toLocaleDateString()}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {showEditForm && (
        <LeadForm
          leadId={leadId}
          onClose={() => setShowEditForm(false)}
          onSave={() => setShowEditForm(false)}
        />
      )}

      {showAddContact && (
        <ContactForm
          leadId={leadId}
          onClose={() => setShowAddContact(false)}
          onSave={() => setShowAddContact(false)}
        />
      )}
    </div>
  );
};