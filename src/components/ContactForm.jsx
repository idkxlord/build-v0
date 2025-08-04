import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, CheckCircle, User, Mail, Phone, Building, Save } from 'lucide-react';
import { useLeadData } from '../contexts/LeadDataContext';
import { useUser } from '../contexts/UserContext';

/**
 * ContactForm Component - Create and edit contacts for leads
 * Features: validation, inline editing, integration with LeadDataContext
 */
const ContactForm = ({ leadId, contactId = null, onClose, onSave }) => {
  // Context hooks for data and user management
  const { 
    addContact, 
    updateContact, 
    fetchContactsByLeadId, 
    loading, 
    error 
  } = useLeadData();
  const { currentUser } = useUser();

  // Form state management
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    designation: '',
    notes: ''
  });

  // Validation and UI state
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingContact, setExistingContact] = useState(null);

  /**
   * Load existing contact data for editing
   */
  useEffect(() => {
    const loadContactData = async () => {
      if (contactId && leadId) {
        try {
          const contacts = await fetchContactsByLeadId(leadId);
          const contact = contacts.find(c => c.id === contactId);
          if (contact) {
            setFormData({
              name: contact.name || '',
              email: contact.email || '',
              phone: contact.phone || '',
              designation: contact.designation || '',
              notes: contact.notes || ''
            });
            setExistingContact(contact);
          }
        } catch (error) {
          console.error('Error loading contact data:', error);
        }
      }
    };

    loadContactData();
  }, [contactId, leadId, fetchContactsByLeadId]);

  /**
   * Validation rules for form fields
   */
  const validateField = (name, value) => {
    const fieldErrors = {};

    switch (name) {
      case 'name':
        if (!value.trim()) {
          fieldErrors.name = 'Name is required';
        } else if (value.trim().length < 2) {
          fieldErrors.name = 'Name must be at least 2 characters';
        }
        break;

      case 'email':
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          fieldErrors.email = 'Please enter a valid email address';
        }
        break;

      case 'phone':
        if (value && !/^[\+]?[1-9][\d]{0,15}$/.test(value.replace(/[\s\-\(\)]/g, ''))) {
          fieldErrors.phone = 'Please enter a valid phone number';
        }
        break;

      default:
        break;
    }

    return fieldErrors;
  };

  /**
   * Validate entire form
   */
  const validateForm = () => {
    let formErrors = {};

    // Validate all fields
    ['name', 'email', 'phone', 'designation', 'notes'].forEach(field => {
      const fieldErrors = validateField(field, formData[field]);
      formErrors = { ...formErrors, ...fieldErrors };
    });

    return formErrors;
  };

  /**
   * Handle input changes with validation
   */
  const handleInputChange = (name, value) => {
    // Update form data
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Mark field as touched
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));

    // Validate field
    const fieldErrors = validateField(name, value);
    setErrors(prev => ({
      ...prev,
      ...fieldErrors,
      // Clear error if field is now valid
      ...(Object.keys(fieldErrors).length === 0 && { [name]: undefined })
    }));
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const formErrors = validateForm();
    setErrors(formErrors);

    if (Object.keys(formErrors).length > 0) {
      // Mark all fields as touched to show errors
      const touchedFields = {};
      Object.keys(formData).forEach(key => {
        touchedFields[key] = true;
      });
      setTouched(touchedFields);
      return;
    }

    await submitForm();
  };

  /**
   * Submit form data
   */
  const submitForm = async () => {
    setIsSubmitting(true);

    try {
      const contactData = {
        leadId,
        name: formData.name.trim(),
        email: formData.email.trim() || null,
        phone: formData.phone.trim() || null,
        designation: formData.designation.trim() || null,
        notes: formData.notes.trim() || null,
        createdBy: currentUser?.id || 'user-1'
      };

      let result;
      if (contactId && existingContact) {
        // Update existing contact
        result = await updateContact(contactId, {
          name: contactData.name,
          email: contactData.email,
          phone: contactData.phone,
          designation: contactData.designation,
          notes: contactData.notes
        });
      } else {
        // Create new contact
        result = await addContact(contactData);
      }

      if (result) {
        onSave();
      }
    } catch (error) {
      console.error('Error saving contact:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Get field error message
   */
  const getFieldError = (fieldName) => {
    return touched[fieldName] && errors[fieldName] ? errors[fieldName] : null;
  };

  /**
   * Get input styling based on validation state
   */
  const getInputStyling = (fieldName) => {
    const hasError = getFieldError(fieldName);
    const baseClasses = "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:outline-none transition-colors";
    
    if (hasError) {
      return `${baseClasses} border-red-300 focus:ring-red-500 focus:border-red-500`;
    }
    
    return `${baseClasses} border-gray-300 focus:ring-blue-500 focus:border-blue-500`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-lavender-50">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {contactId ? 'Update Contact' : 'Add New Contact'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {contactId ? 'Update contact information' : 'Add a new contact to this lead'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Error Display */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
              <AlertTriangle className="w-5 h-5 text-red-600 mr-3" />
              <span className="text-red-800">{error}</span>
            </div>
          )}

          {/* Contact Information */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <User className="w-5 h-5 mr-2 text-blue-600" />
              Contact Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-2" />
                  Full Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={getInputStyling('name')}
                  placeholder="Enter contact's full name"
                />
                {getFieldError('name') && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    {getFieldError('name')}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="w-4 h-4 inline mr-2" />
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={getInputStyling('email')}
                  placeholder="Enter email address"
                />
                {getFieldError('email') && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    {getFieldError('email')}
                  </p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="w-4 h-4 inline mr-2" />
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className={getInputStyling('phone')}
                  placeholder="Enter phone number"
                />
                {getFieldError('phone') && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    {getFieldError('phone')}
                  </p>
                )}
              </div>

              {/* Designation */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Building className="w-4 h-4 inline mr-2" />
                  Job Title / Designation
                </label>
                <input
                  type="text"
                  value={formData.designation}
                  onChange={(e) => handleInputChange('designation', e.target.value)}
                  className={getInputStyling('designation')}
                  placeholder="e.g., Manager, CTO, Director"
                />
                {getFieldError('designation') && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    {getFieldError('designation')}
                  </p>
                )}
              </div>
            </div>

            {/* Notes */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                className={getInputStyling('notes')}
                rows={4}
                placeholder="Any additional notes about this contact..."
              />
              {getFieldError('notes') && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-1" />
                  {getFieldError('notes')}
                </p>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {contactId ? 'Updating...' : 'Adding...'}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {contactId ? 'Update Contact' : 'Add Contact'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ContactForm;
export { ContactForm };