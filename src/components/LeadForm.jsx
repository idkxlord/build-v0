import React, { useState, useEffect, useMemo } from 'react';
import { X, AlertTriangle, CheckCircle, User, Mail, Phone, Building, DollarSign, Calendar, MapPin } from 'lucide-react';
import { useLeadData } from '../contexts/LeadDataContext';
import { useUser } from '../contexts/UserContext';

/**
 * LeadForm Component - Create and edit leads with dynamic custom fields
 * Features: validation, duplicate detection, custom fields, user assignment
 */
const LeadForm = ({ leadId = null, onClose, onSave }) => {
  // Context hooks for data and user management
  const { 
    leads, 
    pipelines,
    stages,
    createLead, 
    updateLead, 
    fetchLeadById, 
    fetchPipelines,
    fetchStagesByPipelineId,
    loading, 
    error 
  } = useLeadData();
  const { currentUser } = useUser();

  // Form state management
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    status: 'New',
    assigned_to: currentUser?.id || '',
    pipeline_id: '',
    stage_id: '',
    custom_fields: {}
  });

  // Validation and UI state
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [existingLead, setExistingLead] = useState(null);

  // Mock data (in real app, these would come from context or API)
  const users = [
    { id: 'e8a1d4a6-6e0c-4b5b-b684-1ba87d09a1c2', name: 'John Smith', role: 'Manager' },
    { id: 'f9b2e5c7-7f1d-4c6c-c795-2cb98e10b2d3', name: 'Sarah Johnson', role: 'Sales Rep' },
    { id: 'a3c4f6d8-8g2e-4d7d-d8a6-3dc09f21c3e4', name: 'Mike Wilson', role: 'Sales Rep' },
    { id: 'b4d5g7e9-9h3f-4e8e-e9b7-4ed10g32d4f5', name: 'Emma Davis', role: 'Admin' }
  ];

  const statusOptions = ['New', 'Contacted', 'Qualified', 'Lost', 'Won'];

  // Dynamic custom fields schema (in real app, this would come from organization settings)
  const customFieldsSchema = [
    {
      key: 'industry',
      label: 'Industry',
      type: 'select',
      required: false,
      options: ['Technology', 'Healthcare', 'Finance', 'Retail', 'Manufacturing', 'Education', 'Other'],
      icon: Building
    },
    {
      key: 'source',
      label: 'Lead Source',
      type: 'select',
      required: true,
      options: ['Website', 'LinkedIn', 'Referral', 'Cold Call', 'Email Campaign', 'Trade Show', 'Other'],
      icon: MapPin
    },
    {
      key: 'budget',
      label: 'Budget Range',
      type: 'select',
      required: false,
      options: ['< $10K', '$10K - $50K', '$50K - $100K', '$100K - $500K', '> $500K'],
      icon: DollarSign
    },
    {
      key: 'company_size',
      label: 'Company Size',
      type: 'select',
      required: false,
      options: ['1-10', '11-50', '51-200', '201-1000', '1000+'],
      icon: User
    },
    {
      key: 'timeline',
      label: 'Decision Timeline',
      type: 'select',
      required: false,
      options: ['Immediate', '1-3 months', '3-6 months', '6+ months', 'Not specified'],
      icon: Calendar
    },
    {
      key: 'notes',
      label: 'Initial Notes',
      type: 'textarea',
      required: false,
      placeholder: 'Any additional information about this lead...'
    }
  ];

  /**
   * Load existing lead data for editing
   */
  useEffect(() => {
    const loadLeadData = async () => {
      if (leadId) {
        try {
          const lead = await fetchLeadById(leadId);
          if (lead) {
            setFormData({
              name: lead.name || '',
              email: lead.email || '',
              phone: lead.phone || '',
              status: lead.status || 'New',
              assigned_to: lead.assigned_to || currentUser?.id || '',
              pipeline_id: lead.pipeline_id || 'pipeline-1',
              stage_id: lead.stage_id || 'stage-1',
              custom_fields: lead.custom_fields || {}
            });
          }
        } catch (error) {
          console.error('Error loading lead data:', error);
        }
      }
    };

    loadLeadData();
  }, [leadId, fetchLeadById, currentUser]);

  /**
   * Load pipelines on component mount
   */
  useEffect(() => {
    const loadPipelines = async () => {
      const pipelineData = await fetchPipelines();
      
      // Set default pipeline if none selected and pipelines are available
      if (!formData.pipeline_id && pipelineData.length > 0) {
        const defaultPipeline = pipelineData[0];
        setFormData(prev => ({
          ...prev,
          pipeline_id: defaultPipeline.id
        }));
        
        // Load stages for the default pipeline
        const stageData = await fetchStagesByPipelineId(defaultPipeline.id);
        if (stageData.length > 0) {
          setFormData(prev => ({
            ...prev,
            stage_id: stageData[0].id
          }));
        }
      }
    };

    loadPipelines();
  }, [fetchPipelines, fetchStagesByPipelineId, formData.pipeline_id]);

  /**
   * Load stages when pipeline changes
   */
  useEffect(() => {
    const loadStages = async () => {
      if (formData.pipeline_id) {
        const stageData = await fetchStagesByPipelineId(formData.pipeline_id);
        
        // Reset stage selection if current stage is not in the new pipeline
        const currentStageValid = stageData.some(stage => stage.id === formData.stage_id);
        if (!currentStageValid && stageData.length > 0) {
          setFormData(prev => ({
            ...prev,
            stage_id: stageData[0].id
          }));
        }
      }
    };

    loadStages();
  }, [formData.pipeline_id, fetchStagesByPipelineId]);

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
        if (!value.trim()) {
          fieldErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          fieldErrors.email = 'Please enter a valid email address';
        }
        break;

      case 'phone':
        if (value && !/^[\+]?[1-9][\d]{0,15}$/.test(value.replace(/[\s\-\(\)]/g, ''))) {
          fieldErrors.phone = 'Please enter a valid phone number';
        }
        break;

      case 'assigned_to':
        if (!value) {
          fieldErrors.assigned_to = 'Please assign this lead to a user';
        }
        break;

      default:
        // Validate custom fields
        const customField = customFieldsSchema.find(field => field.key === name);
        if (customField && customField.required && !value) {
          fieldErrors[name] = `${customField.label} is required`;
        }
        break;
    }

    return fieldErrors;
  };

  /**
   * Validate entire form
   */
  const validateForm = () => {
    let formErrors = {};

    // Validate standard fields
    ['name', 'email', 'phone', 'assigned_to'].forEach(field => {
      const fieldErrors = validateField(field, formData[field]);
      formErrors = { ...formErrors, ...fieldErrors };
    });

    // Validate required custom fields
    customFieldsSchema.forEach(field => {
      if (field.required) {
        const value = formData.custom_fields[field.key];
        const fieldErrors = validateField(field.key, value);
        formErrors = { ...formErrors, ...fieldErrors };
      }
    });

    return formErrors;
  };

  /**
   * Check for duplicate email addresses
   */
  const checkDuplicateEmail = (email) => {
    if (!email || leadId) return null; // Skip check for edits

    const duplicate = leads.find(lead => 
      lead.email.toLowerCase() === email.toLowerCase() && lead.id !== leadId
    );

    return duplicate;
  };

  /**
   * Handle input changes with validation
   */
  const handleInputChange = (name, value) => {
    // Handle pipeline change - reset stage when pipeline changes
    if (name === 'pipeline_id') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        stage_id: '' // Reset stage when pipeline changes
      }));
      
      // Load stages for the new pipeline
      if (value) {
        fetchStagesByPipelineId(value).then(stageData => {
          if (stageData.length > 0) {
            setFormData(prev => ({
              ...prev,
              stage_id: stageData[0].id
            }));
          }
        });
      }
      
      // Mark field as touched and validate
      setTouched(prev => ({ ...prev, [name]: true }));
      const fieldErrors = validateField(name, value);
      setErrors(prev => ({
        ...prev,
        ...fieldErrors,
        ...(Object.keys(fieldErrors).length === 0 && { [name]: undefined })
      }));
      return;
    }

    // Update form data
    if (name.startsWith('custom_fields.')) {
      const fieldKey = name.replace('custom_fields.', '');
      setFormData(prev => ({
        ...prev,
        custom_fields: {
          ...prev.custom_fields,
          [fieldKey]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

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

    // Check for duplicates on email change
    if (name === 'email') {
      const duplicate = checkDuplicateEmail(value);
      if (duplicate) {
        setDuplicateWarning(`A lead with this email already exists: ${duplicate.name}`);
        setExistingLead(duplicate);
      } else {
        setDuplicateWarning(null);
        setExistingLead(null);
      }
    }
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
      customFieldsSchema.forEach(field => {
        touchedFields[`custom_fields.${field.key}`] = true;
      });
      setTouched(touchedFields);
      return;
    }

    // Check for duplicates one more time
    if (!leadId && duplicateWarning) {
      setShowDuplicateDialog(true);
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
      const leadData = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        status: formData.status,
        assigned_to: formData.assigned_to,
        pipeline_id: formData.pipeline_id,
        stage_id: formData.stage_id,
        org_id: currentUser?.orgId || 'org-1',
        customFields: formData.custom_fields
      };

      let result;
      if (leadId) {
        result = await updateLead(leadId, leadData);
      } else {
        result = await createLead(leadData);
      }

      if (result) {
        onSave();
      }
    } catch (error) {
      console.error('Error saving lead:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle duplicate confirmation
   */
  const handleDuplicateConfirm = () => {
    setShowDuplicateDialog(false);
    setDuplicateWarning(null);
    submitForm();
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

  /**
   * Render custom field input
   */
  const renderCustomField = (field) => {
    const fieldName = `custom_fields.${field.key}`;
    const value = formData.custom_fields[field.key] || '';
    const error = getFieldError(fieldName);
    const Icon = field.icon;

    return (
      <div key={field.key}>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {Icon && <Icon className="w-4 h-4 inline mr-2" />}
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        
        {field.type === 'select' ? (
          <select
            value={value}
            onChange={(e) => handleInputChange(fieldName, e.target.value)}
            className={getInputStyling(fieldName)}
          >
            <option value="">Select {field.label}</option>
            {field.options.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        ) : field.type === 'textarea' ? (
          <textarea
            value={value}
            onChange={(e) => handleInputChange(fieldName, e.target.value)}
            placeholder={field.placeholder}
            rows={3}
            className={getInputStyling(fieldName)}
          />
        ) : (
          <input
            type={field.type || 'text'}
            value={value}
            onChange={(e) => handleInputChange(fieldName, e.target.value)}
            placeholder={field.placeholder}
            className={getInputStyling(fieldName)}
          />
        )}
        
        {error && (
          <p className="mt-1 text-sm text-red-600 flex items-center">
            <AlertTriangle className="w-4 h-4 mr-1" />
            {error}
          </p>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Main Form Modal */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-lavender-50">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {leadId ? 'Update Lead' : 'Create New Lead'}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {leadId ? 'Update lead information and custom fields' : 'Add a new lead to your pipeline'}
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

            {/* Duplicate Warning */}
            {duplicateWarning && (
              <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mr-3" />
                <span className="text-yellow-800">{duplicateWarning}</span>
              </div>
            )}

            {/* Standard Fields */}
            <div className="mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <User className="w-5 h-5 mr-2 text-blue-600" />
                Lead Information
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
                    placeholder="Enter lead's full name"
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
                    Email Address *
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

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className={getInputStyling('status')}
                  >
                    {statusOptions.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>

                {/* Assigned To */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assigned To *
                  </label>
                  <select
                    value={formData.assigned_to}
                    onChange={(e) => handleInputChange('assigned_to', e.target.value)}
                    className={getInputStyling('assigned_to')}
                  >
                    <option value="">Select Owner</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.role})
                      </option>
                    ))}
                  </select>
                  {getFieldError('assigned_to') && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertTriangle className="w-4 h-4 mr-1" />
                      {getFieldError('assigned_to')}
                    </p>
                  )}
                </div>

                {/* Pipeline */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pipeline
                  </label>
                  <select
                    value={formData.pipeline_id}
                    onChange={(e) => handleInputChange('pipeline_id', e.target.value)}
                    className={getInputStyling('pipeline_id')}
                    disabled={pipelines.length === 0}
                  >
                    <option value="">Select Pipeline</option>
                    {pipelines.map(pipeline => (
                      <option key={pipeline.id} value={pipeline.id}>{pipeline.name}</option>
                    ))}
                  </select>
                  {pipelines.length === 0 && (
                    <p className="mt-1 text-sm text-gray-500">Loading pipelines...</p>
                  )}
                </div>

                {/* Stage */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stage
                  </label>
                  <select
                    value={formData.stage_id}
                    onChange={(e) => handleInputChange('stage_id', e.target.value)}
                    className={getInputStyling('stage_id')}
                    disabled={!formData.pipeline_id || stages.length === 0}
                  >
                    <option value="">Select Stage</option>
                    {stages.map(stage => (
                      <option key={stage.id} value={stage.id}>{stage.name}</option>
                    ))}
                  </select>
                  {!formData.pipeline_id && (
                    <p className="mt-1 text-sm text-gray-500">Select a pipeline first</p>
                  )}
                  {formData.pipeline_id && stages.length === 0 && (
                    <p className="mt-1 text-sm text-gray-500">Loading stages...</p>
                  )}
                </div>
              </div>
            </div>

            {/* Custom Fields */}
            <div className="mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Building className="w-5 h-5 mr-2 text-purple-600" />
                Additional Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {customFieldsSchema.map(field => renderCustomField(field))}
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
                    {leadId ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {leadId ? 'Update Lead' : 'Create Lead'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Duplicate Confirmation Dialog */}
      {showDuplicateDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-60">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center mr-4">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Duplicate Email Detected</h3>
              </div>
              
              <p className="text-gray-600 mb-4">
                A lead with the email "{formData.email}" already exists:
              </p>
              
              {existingLead && (
                <div className="bg-gray-50 p-3 rounded-lg mb-4">
                  <p className="font-medium text-gray-900">{existingLead.name}</p>
                  <p className="text-sm text-gray-600">Status: {existingLead.status}</p>
                  <p className="text-sm text-gray-600">Created: {new Date(existingLead.created_at).toLocaleDateString()}</p>
                </div>
              )}
              
              <p className="text-gray-600 mb-6">
                Do you want to create this lead anyway?
              </p>
              
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setShowDuplicateDialog(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDuplicateConfirm}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-medium"
                >
                  Create Anyway
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LeadForm;
export { LeadForm };