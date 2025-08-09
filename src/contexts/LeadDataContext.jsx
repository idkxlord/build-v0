import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useUser } from './UserContext';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Create the context
const LeadDataContext = createContext();

/**
 * Custom hook to use the LeadDataContext
 * Throws error if used outside of provider
 */
export const useLeadData = () => {
  const context = useContext(LeadDataContext);
  if (!context) {
    throw new Error('useLeadData must be used within a LeadDataProvider');
  }
  return context;
};

/**
 * LeadDataProvider component that manages leads and contacts data
 * Provides CRUD operations and caching for leads and contacts
 */
export const LeadDataProvider = ({ children }) => {
  // Get current user for access control
  const { currentUser } = useUser();
  
  // State management for leads, contacts, and UI states
  const [leads, setLeads] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState([]);
  
  // Cache management for optimized data fetching
  const [leadsCache, setLeadsCache] = useState(new Map());
  const [contactsCache, setContactsCache] = useState(new Map());
  const [lastFetchTime, setLastFetchTime] = useState(null);
  
  // Cache expiry time (5 minutes)
  const CACHE_EXPIRY = 5 * 60 * 1000;

  /**
   * Check if user has permission to perform action on lead
   */
  const hasPermission = useCallback((action, lead = null) => {
    if (!currentUser) return false;
    
    const { role, id: userId } = currentUser;
    
    switch (role) {
      case 'Admin':
        return true; // Admins have full access
        
      case 'Manager':
        if (action === 'view' || action === 'create') return true;
        if (action === 'edit' || action === 'delete') {
          // Managers can edit/delete leads assigned to their team members
          // For now, allowing all edit/delete - in real app, check team membership
          return true;
        }
        return true;
        
      case 'Sales Rep':
        if (action === 'view') {
          // Sales reps can only view their own leads
          return !lead || lead.assigned_to === userId;
        }
        if (action === 'create') return true;
        if (action === 'edit' || action === 'delete') {
          // Sales reps can only edit/delete their own leads
          return lead && lead.assigned_to === userId;
        }
        return false;
        
      default:
        return false;
    }
  }, [currentUser]);

  /**
   * Apply role-based filters to query
   */
  const applyRoleFilters = useCallback((query, filters = {}) => {
    if (!currentUser) return query;
    
    const { role, id: userId } = currentUser;
    
    switch (role) {
      case 'Admin':
        // Admins see all leads
        break;
        
      case 'Manager':
        // Managers see leads under their team
        // For now, showing all leads - in real app, filter by team membership
        break;
        
      case 'Sales Rep':
        // Sales reps see only their own leads
        query = query.eq('assigned_to', userId);
        break;
    }
    
    return query;
  }, [currentUser]);

  /**
   * Check if cache is still valid based on timestamp
   */
  const isCacheValid = useCallback((timestamp) => {
    return timestamp && (Date.now() - timestamp) < CACHE_EXPIRY;
  }, []);

  /**
   * Handle errors consistently across all operations
   */
  const handleError = useCallback((error, operation) => {
    console.error(`Error in ${operation}:`, error);
    setError(`Failed to ${operation}: ${error.message}`);
    setLoading(false);
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Fetch leads with optional filters
   * Supports filtering by status, assigned_to, and pipeline_id
   */
  const fetchLeads = useCallback(async (filters = {}) => {
    try {
      // Check view permission
      if (!hasPermission('view')) {
        setError('You do not have permission to view leads');
        setLoading(false);
        return [];
      }
      
      setLoading(true);
      setError(null);

      // Create cache key based on filters
      const cacheKey = JSON.stringify(filters);
      const cachedData = leadsCache.get(cacheKey);
      
      // Return cached data if valid
      if (cachedData && isCacheValid(cachedData.timestamp)) {
        setLeads(cachedData.data);
        setLoading(false);
        return cachedData.data;
      }

      // Build query with filters
      let query = supabase
        .from('leads')
        .select(`
          *,
          assigned_user:users!leads_assigned_to_fkey(id, name, email),
          pipeline:pipelines!leads_pipeline_id_fkey(id, name),
          stage:stages!leads_stage_id_fkey(id, name, order_position)
        `)
        .order('created_at', { ascending: false });

      // Apply role-based filters
      query = applyRoleFilters(query, filters);

      // Apply filters if provided
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.assigned_to) {
        query = query.eq('assigned_to', filters.assigned_to);
      }
      if (filters.pipeline_id) {
        query = query.eq('pipeline_id', filters.pipeline_id);
      }
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      // Transform data to match expected format
      const transformedLeads = data.map(lead => ({
        ...lead,
        customFields: lead.custom_fields || {},
        createdAt: new Date(lead.created_at),
        updatedAt: new Date(lead.updated_at)
      }));

      // Update cache
      setLeadsCache(prev => new Map(prev.set(cacheKey, {
        data: transformedLeads,
        timestamp: Date.now()
      })));

      setLeads(transformedLeads);
      setLastFetchTime(Date.now());
      return transformedLeads;

    } catch (error) {
      handleError(error, 'fetch leads');
      return [];
    } finally {
      setLoading(false);
    }
  }, [leadsCache, isCacheValid, handleError, hasPermission, applyRoleFilters]);

  /**
   * Fetch a single lead by ID with related contacts
   */
  const fetchLeadById = useCallback(async (leadId) => {
    try {
      setLoading(true);
      setError(null);

      // Check cache first
      const cachedLead = leadsCache.get(`lead_${leadId}`);
      if (cachedLead && isCacheValid(cachedLead.timestamp) && hasPermission('view', cachedLead.data)) {
        setLoading(false);
        return cachedLead.data;
      }

      const { data, error: fetchError } = await supabase
        .from('leads')
        .select(`
          *,
          assigned_user:users!leads_assigned_to_fkey(id, name, email),
          pipeline:pipelines!leads_pipeline_id_fkey(id, name),
          stage:stages!leads_stage_id_fkey(id, name, order_position),
          contacts(*)
        `)
        .eq('id', leadId)
        .single();

      if (fetchError) throw fetchError;

      // Transform data
      const transformedLead = {
        ...data,
        customFields: data.custom_fields || {},
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        contacts: data.contacts?.map(contact => ({
          ...contact,
          createdAt: new Date(contact.created_at),
          updatedAt: new Date(contact.updated_at)
        })) || []
      };

      // Check view permission for this specific lead
      if (!hasPermission('view', transformedLead)) {
        setError('You do not have permission to view this lead');
        setLoading(false);
        return null;
      }

      // Update cache
      setLeadsCache(prev => new Map(prev.set(`lead_${leadId}`, {
        data: transformedLead,
        timestamp: Date.now()
      })));

      return transformedLead;

    } catch (error) {
      handleError(error, 'fetch lead details');
      return null;
    } finally {
      setLoading(false);
    }
  }, [leadsCache, isCacheValid, handleError, hasPermission]);

  /**
   * Create a new lead
   */
  const createLead = useCallback(async (leadData) => {
    try {
      // Check create permission
      if (!hasPermission('create')) {
        setError('You do not have permission to create leads');
        return null;
      }
      
      setLoading(true);
      setError(null);

      // Prepare data for insertion
      const insertData = {
        name: leadData.name,
        email: leadData.email,
        phone: leadData.phone || null,
        status: leadData.status || 'New',
        stage_id: leadData.stageId,
        pipeline_id: leadData.pipelineId,
        assigned_to: leadData.assignedTo,
        org_id: leadData.orgId,
        custom_fields: leadData.customFields || {}
      };

      const { data, error: insertError } = await supabase
        .from('leads')
        .insert([insertData])
        .select(`
          *,
          assigned_user:users!leads_assigned_to_fkey(id, name, email),
          pipeline:pipelines!leads_pipeline_id_fkey(id, name),
          stage:stages!leads_stage_id_fkey(id, name, order_position)
        `)
        .single();

      if (insertError) throw insertError;

      // Transform and add to local state
      const newLead = {
        ...data,
        customFields: data.custom_fields || {},
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };

      setLeads(prev => [newLead, ...prev]);
      
      // Clear relevant caches
      setLeadsCache(new Map());

      return newLead;

    } catch (error) {
      handleError(error, 'create lead');
      return null;
    } finally {
      setLoading(false);
    }
  }, [handleError, hasPermission]);

  /**
   * Update an existing lead
   */
  const updateLead = useCallback(async (leadId, updates) => {
    try {
      // First fetch the lead to check permissions
      const existingLead = leads.find(lead => lead.id === leadId);
      if (!existingLead || !hasPermission('edit', existingLead)) {
        setError('You do not have permission to edit this lead');
        return null;
      }
      
      setLoading(true);
      setError(null);

      // Prepare update data
      const updateData = {
        ...(updates.name && { name: updates.name }),
        ...(updates.email && { email: updates.email }),
        ...(updates.phone !== undefined && { phone: updates.phone }),
        ...(updates.status && { status: updates.status }),
        ...(updates.stageId && { stage_id: updates.stageId }),
        ...(updates.pipelineId && { pipeline_id: updates.pipelineId }),
        ...(updates.assignedTo && { assigned_to: updates.assignedTo }),
        ...(updates.customFields && { custom_fields: updates.customFields }),
        updated_at: new Date().toISOString()
      };

      const { data, error: updateError } = await supabase
        .from('leads')
        .update(updateData)
        .eq('id', leadId)
        .select(`
          *,
          assigned_user:users!leads_assigned_to_fkey(id, name, email),
          pipeline:pipelines!leads_pipeline_id_fkey(id, name),
          stage:stages!leads_stage_id_fkey(id, name, order_position)
        `)
        .single();

      if (updateError) throw updateError;

      // Transform updated lead
      const updatedLead = {
        ...data,
        customFields: data.custom_fields || {},
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };

      // Update local state
      setLeads(prev => prev.map(lead => 
        lead.id === leadId ? updatedLead : lead
      ));

      // Clear relevant caches
      setLeadsCache(prev => {
        const newCache = new Map(prev);
        newCache.delete(`lead_${leadId}`);
        return newCache;
      });

      return updatedLead;

    } catch (error) {
      handleError(error, 'update lead');
      return null;
    } finally {
      setLoading(false);
    }
  }, [handleError, hasPermission, leads]);

  /**
   * Delete a lead and all associated contacts
   */
  const deleteLead = useCallback(async (leadId) => {
    try {
      // First fetch the lead to check permissions
      const existingLead = leads.find(lead => lead.id === leadId);
      if (!existingLead || !hasPermission('delete', existingLead)) {
        setError('You do not have permission to delete this lead');
        return false;
      }
      
      setLoading(true);
      setError(null);

      // Delete associated contacts first (if not handled by cascade)
      await supabase
        .from('contacts')
        .delete()
        .eq('lead_id', leadId);

      // Delete the lead
      const { error: deleteError } = await supabase
        .from('leads')
        .delete()
        .eq('id', leadId);

      if (deleteError) throw deleteError;

      // Update local state
      setLeads(prev => prev.filter(lead => lead.id !== leadId));
      setContacts(prev => prev.filter(contact => contact.lead_id !== leadId));

      // Clear caches
      setLeadsCache(prev => {
        const newCache = new Map(prev);
        newCache.delete(`lead_${leadId}`);
        return newCache;
      });
      setContactsCache(prev => {
        const newCache = new Map(prev);
        newCache.delete(`contacts_${leadId}`);
        return newCache;
      });

      return true;

    } catch (error) {
      handleError(error, 'delete lead');
      return false;
    } finally {
      setLoading(false);
    }
  }, [handleError, hasPermission, leads]);

  /**
   * Fetch contacts for a specific lead
   */
  const fetchContactsByLeadId = useCallback(async (leadId) => {
    try {
      setLoading(true);
      setError(null);

      // Check cache first
      const cachedContacts = contactsCache.get(`contacts_${leadId}`);
      if (cachedContacts && isCacheValid(cachedContacts.timestamp)) {
        setLoading(false);
        return cachedContacts.data;
      }

      const { data, error: fetchError } = await supabase
        .from('contacts')
        .select(`
          *,
          created_by_user:users!contacts_created_by_fkey(id, name, email)
        `)
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      // Transform contacts
      const transformedContacts = data.map(contact => ({
        ...contact,
        leadId: contact.lead_id,
        createdBy: contact.created_by,
        createdAt: new Date(contact.created_at),
        updatedAt: new Date(contact.updated_at)
      }));

      // Update cache
      setContactsCache(prev => new Map(prev.set(`contacts_${leadId}`, {
        data: transformedContacts,
        timestamp: Date.now()
      })));

      return transformedContacts;

    } catch (error) {
      handleError(error, 'fetch contacts');
      return [];
    } finally {
      setLoading(false);
    }
  }, [contactsCache, isCacheValid, handleError]);

  /**
   * Add a new contact to a lead
   */
  const addContact = useCallback(async (contactData) => {
    try {
      setLoading(true);
      setError(null);

      // Prepare contact data
      const insertData = {
        lead_id: contactData.leadId,
        name: contactData.name,
        email: contactData.email || null,
        phone: contactData.phone || null,
        designation: contactData.designation || null,
        notes: contactData.notes || null,
        created_by: contactData.createdBy
      };

      const { data, error: insertError } = await supabase
        .from('contacts')
        .insert([insertData])
        .select(`
          *,
          created_by_user:users!contacts_created_by_fkey(id, name, email)
        `)
        .single();

      if (insertError) throw insertError;

      // Transform new contact
      const newContact = {
        ...data,
        leadId: data.lead_id,
        createdBy: data.created_by,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };

      // Update local state
      setContacts(prev => [newContact, ...prev]);

      // Clear contacts cache for this lead
      setContactsCache(prev => {
        const newCache = new Map(prev);
        newCache.delete(`contacts_${contactData.leadId}`);
        return newCache;
      });

      return newContact;

    } catch (error) {
      handleError(error, 'add contact');
      return null;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  /**
   * Update an existing contact
   */
  const updateContact = useCallback(async (contactId, updates) => {
    try {
      setLoading(true);
      setError(null);

      const updateData = {
        ...(updates.name && { name: updates.name }),
        ...(updates.email !== undefined && { email: updates.email }),
        ...(updates.phone !== undefined && { phone: updates.phone }),
        ...(updates.designation !== undefined && { designation: updates.designation }),
        ...(updates.notes !== undefined && { notes: updates.notes }),
        updated_at: new Date().toISOString()
      };

      const { data, error: updateError } = await supabase
        .from('contacts')
        .update(updateData)
        .eq('id', contactId)
        .select(`
          *,
          created_by_user:users!contacts_created_by_fkey(id, name, email)
        `)
        .single();

      if (updateError) throw updateError;

      const updatedContact = {
        ...data,
        leadId: data.lead_id,
        createdBy: data.created_by,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };

      // Update local state
      setContacts(prev => prev.map(contact => 
        contact.id === contactId ? updatedContact : contact
      ));

      // Clear relevant cache
      setContactsCache(prev => {
        const newCache = new Map(prev);
        newCache.delete(`contacts_${updatedContact.leadId}`);
        return newCache;
      });

      return updatedContact;

    } catch (error) {
      handleError(error, 'update contact');
      return null;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  /**
   * Delete a contact
   */
  const deleteContact = useCallback(async (contactId) => {
    try {
      setLoading(true);
      setError(null);

      const { error: deleteError } = await supabase
        .from('contacts')
        .delete()
        .eq('id', contactId);

      if (deleteError) throw deleteError;

      // Update local state
      setContacts(prev => prev.filter(contact => contact.id !== contactId));

      // Clear all contacts cache (simpler approach)
      setContactsCache(new Map());

      return true;

    } catch (error) {
      handleError(error, 'delete contact');
      return false;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  /**
   * Bulk update leads (for bulk actions)
   */
  const bulkUpdateLeads = useCallback(async (leadIds, updates) => {
    try {
      // Check permissions for all leads being updated
      const leadsToUpdate = leads.filter(lead => leadIds.includes(lead.id));
      const unauthorizedLeads = leadsToUpdate.filter(lead => !hasPermission('edit', lead));
      
      if (unauthorizedLeads.length > 0) {
        setError(`You do not have permission to edit ${unauthorizedLeads.length} of the selected leads`);
        return [];
      }
      
      setLoading(true);
      setError(null);

      const updateData = {
        ...(updates.status && { status: updates.status }),
        ...(updates.assignedTo && { assigned_to: updates.assignedTo }),
        ...(updates.stageId && { stage_id: updates.stageId }),
        updated_at: new Date().toISOString()
      };

      const { data, error: updateError } = await supabase
        .from('leads')
        .update(updateData)
        .in('id', leadIds)
        .select(`
          *,
          assigned_user:users!leads_assigned_to_fkey(id, name, email),
          pipeline:pipelines!leads_pipeline_id_fkey(id, name),
          stage:stages!leads_stage_id_fkey(id, name, order_position)
        `);

      if (updateError) throw updateError;

      // Transform updated leads
      const updatedLeads = data.map(lead => ({
        ...lead,
        customFields: lead.custom_fields || {},
        createdAt: new Date(lead.created_at),
        updatedAt: new Date(lead.updated_at)
      }));

      // Update local state
      setLeads(prev => prev.map(lead => {
        const updated = updatedLeads.find(ul => ul.id === lead.id);
        return updated || lead;
      }));

      // Clear caches
      setLeadsCache(new Map());

      return updatedLeads;

    } catch (error) {
      handleError(error, 'bulk update leads');
      return [];
    } finally {
      setLoading(false);
    }
  }, [handleError, hasPermission, leads]);

  /**
   * Get lead statistics for dashboard
   */
  const getLeadStats = useCallback(() => {
    const totalLeads = leads.length;
    const statusCounts = leads.reduce((acc, lead) => {
      acc[lead.status] = (acc[lead.status] || 0) + 1;
      return acc;
    }, {});

    const conversionRate = totalLeads > 0 
      ? ((statusCounts.Won || 0) / totalLeads * 100).toFixed(1)
      : '0';

    return {
      totalLeads,
      statusCounts,
      conversionRate,
      qualifiedLeads: statusCounts.Qualified || 0,
      wonLeads: statusCounts.Won || 0,
      lostLeads: statusCounts.Lost || 0
    };
  }, [leads]);

  // Fetch users for analytics and assignments
  const fetchUsers = async () => {
    try {
      // Use mock data for users since we don't have proper RLS policies set up yet
      const mockUsers = [
        { id: 'e8a1d4a6-6e0c-4b5b-b684-1ba87d09a1c2', name: 'John Smith', role: 'Manager', email: 'john@company.com' },
        { id: 'f9b2e5c7-7f1d-4c6c-c795-2cb98e10b2d3', name: 'Sarah Johnson', role: 'Sales Rep', email: 'sarah@company.com' },
        { id: 'a3c4f6d8-8g2e-4d7d-d8a6-3dc09f21c3e4', name: 'Mike Wilson', role: 'Sales Rep', email: 'mike@company.com' },
        { id: 'b4d5g7e9-9h3f-4e8e-e9b7-4ed10g32d4f5', name: 'Emma Davis', role: 'Admin', email: 'emma@company.com' }
      ];
      setUsers(mockUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      // Fallback to mock data if there's an error
      const mockUsers = [
        { id: 'e8a1d4a6-6e0c-4b5b-b684-1ba87d09a1c2', name: 'John Smith', role: 'Manager', email: 'john@company.com' },
        { id: 'f9b2e5c7-7f1d-4c6c-c795-2cb98e10b2d3', name: 'Sarah Johnson', role: 'Sales Rep', email: 'sarah@company.com' },
        { id: 'a3c4f6d8-8g2e-4d7d-d8a6-3dc09f21c3e4', name: 'Mike Wilson', role: 'Sales Rep', email: 'mike@company.com' },
        { id: 'b4d5g7e9-9h3f-4e8e-e9b7-4ed10g32d4f5', name: 'Emma Davis', role: 'Admin', email: 'emma@company.com' }
      ];
      setUsers(mockUsers);
    }
  };

  // Initialize data on mount
  useEffect(() => {
    fetchLeads();
    fetchUsers();
  }, []);

  // Context value with all methods and state
  const contextValue = {
    // State
    leads,
    contacts,
    users,
    loading,
    error,
    lastFetchTime,

    // Lead operations
    fetchLeads,
    fetchLeadById,
    createLead,
    updateLead,
    deleteLead,
    bulkUpdateLeads,

    // Contact operations
    fetchContactsByLeadId,
    addContact,
    updateContact,
    deleteContact,

    // Utility functions
    getLeadStats,
    clearError,
    hasPermission,

    // Cache management
    clearCache: () => {
      setLeadsCache(new Map());
      setContactsCache(new Map());
    }
  };

  return (
    <LeadDataContext.Provider value={contextValue}>
      {children}
    </LeadDataContext.Provider>
  );
};

export default LeadDataProvider;