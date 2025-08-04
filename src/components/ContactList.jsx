import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  User, 
  Mail, 
  Phone, 
  Building, 
  Edit, 
  Trash2, 
  MoreVertical,
  AlertTriangle,
  X,
  Users
} from 'lucide-react';
import { useLeadData } from '../contexts/LeadDataContext';
import ContactForm from './ContactForm';

/**
 * ContactList Component - Display and manage contacts for a specific lead
 * Features: inline editing, deletion, responsive design
 */
const ContactList = ({ leadId }) => {
  // Context hooks for data management
  const { 
    fetchContactsByLeadId, 
    deleteContact, 
    hasPermission,
    loading, 
    error, 
    clearError 
  } = useLeadData();

  // Component state management
  const [contacts, setContacts] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingContactId, setEditingContactId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingContactId, setDeletingContactId] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);

  /**
   * Load contacts for the lead
   */
  const loadContacts = async () => {
    if (leadId) {
      try {
        const contactsData = await fetchContactsByLeadId(leadId);
        setContacts(contactsData || []);
      } catch (error) {
        console.error('Error loading contacts:', error);
      }
    }
  };

  // Load contacts on component mount and when leadId changes
  useEffect(() => {
    loadContacts();
  }, [leadId]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setActiveDropdown(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  /**
   * Handle contact actions
   */
  const handleEdit = (contactId, event) => {
    event.stopPropagation();
    // Note: Contact permissions are typically tied to lead permissions
    // Check if user can edit the parent lead
    if (!hasPermission('edit')) {
      alert('You do not have permission to edit contacts for this lead');
      return;
    }
    setEditingContactId(contactId);
    setShowEditForm(true);
    setActiveDropdown(null);
  };

  const handleDelete = (contactId, event) => {
    event.stopPropagation();
    if (!hasPermission('edit')) {
      alert('You do not have permission to delete contacts for this lead');
      return;
    }
    setDeletingContactId(contactId);
    setShowDeleteConfirm(true);
    setActiveDropdown(null);
  };

  /**
   * Confirm contact deletion
   */
  const confirmDelete = async () => {
    if (deletingContactId) {
      const success = await deleteContact(deletingContactId);
      if (success) {
        await loadContacts(); // Refresh the list
      }
      setShowDeleteConfirm(false);
      setDeletingContactId(null);
    }
  };

  /**
   * Handle form save - refresh contacts list
   */
  const handleFormSave = async () => {
    setShowAddForm(false);
    setShowEditForm(false);
    setEditingContactId(null);
    await loadContacts(); // Refresh the list
  };

  /**
   * Get initials for avatar
   */
  const getInitials = (name) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Users className="w-5 h-5 mr-2 text-blue-600" />
            Contacts ({contacts.length})
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Manage all contacts associated with this lead
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          disabled={!hasPermission('edit')}
          className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Contact
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-600 mr-3" />
            <span className="text-red-800">{error}</span>
          </div>
          <button
            onClick={clearError}
            className="text-red-600 hover:text-red-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading contacts...</span>
        </div>
      )}

      {/* Contacts List */}
      {!loading && (
        <>
          {contacts.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <User className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No contacts yet</h3>
              <p className="text-gray-500 mb-4">
                Start by adding the first contact for this lead
              </p>
             {hasPermission('edit') && (
               <button
                 onClick={() => setShowAddForm(true)}
                 className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
               >
                 Add First Contact
               </button>
             )}
            </div>
          ) : (
            <div className="space-y-4">
              {contacts.map((contact) => (
                <div
                  key={contact.id}
                  className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      {/* Avatar */}
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-sm font-medium">
                          {getInitials(contact.name)}
                        </span>
                      </div>

                      {/* Contact Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-lg font-semibold text-gray-900 truncate">
                            {contact.name}
                          </h4>
                          <div className="relative ml-4">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveDropdown(activeDropdown === contact.id ? null : contact.id);
                              }}
                              className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded hover:bg-gray-100"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                            
                            {activeDropdown === contact.id && (
                              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                                <div className="py-2">
                                  {hasPermission('edit') && (
                                    <>
                                      <button
                                        onClick={(e) => handleEdit(contact.id, e)}
                                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 flex items-center transition-colors"
                                      >
                                        <Edit className="w-4 h-4 mr-3" />
                                        Edit Contact
                                      </button>
                                      <hr className="my-2" />
                                      <button
                                        onClick={(e) => handleDelete(contact.id, e)}
                                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center transition-colors"
                                      >
                                        <Trash2 className="w-4 h-4 mr-3" />
                                        Delete Contact
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Contact Details */}
                        <div className="space-y-2">
                          {contact.designation && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Building className="w-4 h-4 mr-2 text-gray-400" />
                              <span className="font-medium">{contact.designation}</span>
                            </div>
                          )}
                          
                          {contact.email && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Mail className="w-4 h-4 mr-2 text-gray-400" />
                              <a 
                                href={`mailto:${contact.email}`}
                                className="text-blue-600 hover:text-blue-700 transition-colors"
                              >
                                {contact.email}
                              </a>
                            </div>
                          )}
                          
                          {contact.phone && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Phone className="w-4 h-4 mr-2 text-gray-400" />
                              <a 
                                href={`tel:${contact.phone}`}
                                className="text-blue-600 hover:text-blue-700 transition-colors"
                              >
                                {contact.phone}
                              </a>
                            </div>
                          )}
                        </div>

                        {/* Notes */}
                        {contact.notes && (
                          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-700">{contact.notes}</p>
                          </div>
                        )}

                        {/* Metadata */}
                        <div className="mt-4 pt-3 border-t border-gray-100">
                          <p className="text-xs text-gray-500">
                            Added on {new Date(contact.createdAt).toLocaleDateString()}
                            {contact.createdAt !== contact.updatedAt && (
                              <span> • Updated {new Date(contact.updatedAt).toLocaleDateString()}</span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Add Contact Form */}
      {showAddForm && hasPermission('edit') && (
        <ContactForm
          leadId={leadId}
          onClose={() => setShowAddForm(false)}
          onSave={handleFormSave}
        />
      )}

      {/* Edit Contact Form */}
      {showEditForm && editingContactId && hasPermission('edit') && (
        <ContactForm
          leadId={leadId}
          contactId={editingContactId}
          onClose={() => {
            setShowEditForm(false);
            setEditingContactId(null);
          }}
          onSave={handleFormSave}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-4">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Contact</h3>
              </div>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this contact? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeletingContactId(null);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  Delete Contact
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactList;