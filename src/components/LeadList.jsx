import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Filter, 
  Search, 
  MoreVertical, 
  Phone, 
  Mail, 
  User, 
  Edit, 
  Trash2, 
  UserPlus,
  CheckSquare,
  Square,
  Users,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  AlertTriangle
} from 'lucide-react';
import { useLeadData } from '../contexts/LeadDataContext';
import { useUser } from '../contexts/UserContext';
import LeadForm from './LeadForm';

/**
 * LeadList Component - Displays leads in responsive card/table layout
 * Features: filtering, sorting, bulk actions, responsive design
 */
const LeadList = ({ onSelectLead }) => {
  // Context hooks for data and user management
  const { 
    leads, 
    users,
    loading, 
    error, 
    fetchLeads, 
    deleteLead, 
    bulkUpdateLeads,
    clearError,
    hasPermission
  } = useLeadData();
  const { currentUser } = useUser();

  // Component state management
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingLeadId, setEditingLeadId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingLeadId, setDeletingLeadId] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [selectedLeads, setSelectedLeads] = useState(new Set());
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'cards'

  // Filter and search state
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    assigned_to: 'all',
    pipeline_id: 'all'
  });

  // Sorting state
  const [sortConfig, setSortConfig] = useState({
    key: 'created_at',
    direction: 'desc'
  });

  const pipelines = [
    { id: 'c5e6h8f0-0i4g-4f9f-f0c8-5fe21h43e5g6', name: 'Sales Pipeline' },
    { id: 'd6f7i9g1-1j5h-4g0g-g1d9-6gf32i54f6h7', name: 'Marketing Pipeline' }
  ];

  const statusOptions = ['New', 'Contacted', 'Qualified', 'Lost', 'Won'];

  // Load leads on component mount and when filters change
  useEffect(() => {
    const filterParams = {};
    if (filters.status !== 'all') filterParams.status = filters.status;
    if (filters.assigned_to !== 'all') filterParams.assigned_to = filters.assigned_to;
    if (filters.pipeline_id !== 'all') filterParams.pipeline_id = filters.pipeline_id;
    if (filters.search) filterParams.search = filters.search;

    fetchLeads(filterParams);
  }, [filters, fetchLeads]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setActiveDropdown(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  /**
   * Filter and sort leads based on current state
   */
  const filteredAndSortedLeads = useMemo(() => {
    let filtered = [...leads];

    // Client-side search if not handled by server
    if (filters.search && !loading) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(lead => 
        lead.name.toLowerCase().includes(searchLower) ||
        lead.email.toLowerCase().includes(searchLower) ||
        lead.phone.includes(filters.search)
      );
    }

    // Sort leads
    filtered.sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      // Handle different data types
      if (sortConfig.key === 'created_at' || sortConfig.key === 'updated_at') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      } else if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });

    return filtered;
  }, [leads, filters.search, sortConfig, loading]);

  /**
   * Handle sorting column clicks
   */
  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  /**
   * Get sort icon for column headers
   */
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="w-4 h-4 text-blue-600" />
      : <ArrowDown className="w-4 h-4 text-blue-600" />;
  };

  /**
   * Get status badge styling
   */
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

  /**
   * Get user name by ID
   */
  const getUserName = (userId) => {
    return users.find(user => user.id === userId)?.name || 'Unknown';
  };

  /**
   * Get pipeline name by ID
   */
  const getPipelineName = (pipelineId) => {
    return pipelines.find(p => p.id === pipelineId)?.name || 'Unknown';
  };

  /**
   * Handle lead selection for bulk actions
   */
  const handleLeadSelect = (leadId) => {
    setSelectedLeads(prev => {
      const newSet = new Set(prev);
      if (newSet.has(leadId)) {
        newSet.delete(leadId);
      } else {
        newSet.add(leadId);
      }
      setShowBulkActions(newSet.size > 0);
      return newSet;
    });
  };

  /**
   * Select all visible leads
   */
  const handleSelectAll = () => {
    if (selectedLeads.size === filteredAndSortedLeads.length) {
      setSelectedLeads(new Set());
      setShowBulkActions(false);
    } else {
      setSelectedLeads(new Set(filteredAndSortedLeads.map(lead => lead.id)));
      setShowBulkActions(true);
    }
  };

  /**
   * Handle individual lead actions
   */
  const handleEdit = (leadId, event) => {
    event.stopPropagation();
    const lead = filteredAndSortedLeads.find(l => l.id === leadId);
    if (!hasPermission('edit', lead)) {
      alert('You do not have permission to edit this lead');
      return;
    }
    setEditingLeadId(leadId);
    setShowEditForm(true);
    setActiveDropdown(null);
  };

  const handleDelete = (leadId, event) => {
    event.stopPropagation();
    const lead = filteredAndSortedLeads.find(l => l.id === leadId);
    if (!hasPermission('delete', lead)) {
      alert('You do not have permission to delete this lead');
      return;
    }
    setDeletingLeadId(leadId);
    setShowDeleteConfirm(true);
    setActiveDropdown(null);
  };

  const handleAddContact = (leadId, event) => {
    event.stopPropagation();
    onSelectLead(leadId);
    setActiveDropdown(null);
  };

  /**
   * Confirm lead deletion
   */
  const confirmDelete = async () => {
    if (deletingLeadId) {
      await deleteLead(deletingLeadId);
      setShowDeleteConfirm(false);
      setDeletingLeadId(null);
    }
  };

  /**
   * Handle bulk actions
   */
  const handleBulkAction = async (action, value) => {
    const leadIds = Array.from(selectedLeads);
    
    // Check permissions for bulk actions
    if (action !== 'delete') {
      const leadsToUpdate = filteredAndSortedLeads.filter(lead => leadIds.includes(lead.id));
      const unauthorizedLeads = leadsToUpdate.filter(lead => !hasPermission('edit', lead));
      if (unauthorizedLeads.length > 0) {
        alert(`You do not have permission to edit ${unauthorizedLeads.length} of the selected leads`);
        return;
      }
    }
    
    const updates = {};
    
    switch (action) {
      case 'status':
        updates.status = value;
        break;
      case 'assign':
        updates.assignedTo = value;
        break;
      case 'delete':
        // Handle bulk delete
        for (const leadId of leadIds) {
          await deleteLead(leadId);
        }
        setSelectedLeads(new Set());
        setShowBulkActions(false);
        return;
    }

    if (Object.keys(updates).length > 0) {
      await bulkUpdateLeads(leadIds, updates);
      setSelectedLeads(new Set());
      setShowBulkActions(false);
    }
  };

  /**
   * Clear all filters
   */
  const clearFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      assigned_to: 'all',
      pipeline_id: 'all'
    });
  };

  /**
   * Render table view
   */
  const renderTableView = () => (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      {/* Table Header */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-blue-50 to-lavender-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left">
                <button
                  onClick={handleSelectAll}
                  className="flex items-center hover:bg-blue-100 p-1 rounded transition-colors"
                >
                  {selectedLeads.size === filteredAndSortedLeads.length && filteredAndSortedLeads.length > 0 ? (
                    <CheckSquare className="w-4 h-4 text-blue-600" />
                  ) : (
                    <Square className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              </th>
              <th className="px-6 py-4 text-left">
                <button
                  onClick={() => handleSort('name')}
                  className="flex items-center space-x-2 text-xs font-medium text-gray-700 uppercase tracking-wider hover:text-blue-600 transition-colors"
                >
                  <span>Lead</span>
                  {getSortIcon('name')}
                </button>
              </th>
              <th className="px-6 py-4 text-left">
                <button
                  onClick={() => handleSort('status')}
                  className="flex items-center space-x-2 text-xs font-medium text-gray-700 uppercase tracking-wider hover:text-blue-600 transition-colors"
                >
                  <span>Status</span>
                  {getSortIcon('status')}
                </button>
              </th>
              <th className="px-6 py-4 text-left">
                <button
                  onClick={() => handleSort('assigned_to')}
                  className="flex items-center space-x-2 text-xs font-medium text-gray-700 uppercase tracking-wider hover:text-blue-600 transition-colors"
                >
                  <span>Owner</span>
                  {getSortIcon('assigned_to')}
                </button>
              </th>
              <th className="px-6 py-4 text-left">
                <span className="text-xs font-medium text-gray-700 uppercase tracking-wider">Pipeline</span>
              </th>
              <th className="px-6 py-4 text-left">
                <button
                  onClick={() => handleSort('created_at')}
                  className="flex items-center space-x-2 text-xs font-medium text-gray-700 uppercase tracking-wider hover:text-blue-600 transition-colors"
                >
                  <span>Created</span>
                  {getSortIcon('created_at')}
                </button>
              </th>
              <th className="px-6 py-4 text-right">
                <span className="text-xs font-medium text-gray-700 uppercase tracking-wider">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAndSortedLeads.map((lead) => (
              <tr
                key={lead.id}
                className={`hover:bg-blue-50 cursor-pointer transition-all duration-200 ${
                  selectedLeads.has(lead.id) ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                }`}
                onClick={() => onSelectLead(lead.id)}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLeadSelect(lead.id);
                    }}
                    className="hover:bg-blue-100 p-1 rounded transition-colors"
                  >
                    {selectedLeads.has(lead.id) ? (
                      <CheckSquare className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Square className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{lead.name}</div>
                    <div className="flex items-center space-x-4 mt-1">
                      <div className="flex items-center text-sm text-gray-500">
                        <Mail className="w-3 h-3 mr-1" />
                        {lead.email}
                      </div>
                      {lead.phone && (
                        <div className="flex items-center text-sm text-gray-500">
                          <Phone className="w-3 h-3 mr-1" />
                          {lead.phone}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(lead.status)}`}>
                    {lead.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div className="flex items-center">
                    <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mr-2">
                      <span className="text-white text-xs font-medium">
                        {getUserName(lead.assigned_to).split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    {getUserName(lead.assigned_to)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {getPipelineName(lead.pipeline_id)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(lead.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveDropdown(activeDropdown === lead.id ? null : lead.id);
                      }}
                      className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded hover:bg-gray-100"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    
                    {activeDropdown === lead.id && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                        <div className="py-2">
                          {hasPermission('edit', lead) && (
                            <button
                              onClick={(e) => handleEdit(lead.id, e)}
                              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 flex items-center transition-colors"
                            >
                              <Edit className="w-4 h-4 mr-3" />
                              Edit Lead
                            </button>
                          )}
                          <button
                            onClick={(e) => handleAddContact(lead.id, e)}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 flex items-center transition-colors"
                          >
                            <UserPlus className="w-4 h-4 mr-3" />
                            Add Contact
                          </button>
                          {hasPermission('delete', lead) && (
                            <>
                              <hr className="my-2" />
                              <button
                                onClick={(e) => handleDelete(lead.id, e)}
                                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center transition-colors"
                              >
                                <Trash2 className="w-4 h-4 mr-3" />
                                Delete Lead
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  /**
   * Render card view
   */
  const renderCardView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {filteredAndSortedLeads.map((lead) => (
        <div
          key={lead.id}
          className={`bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg cursor-pointer transition-all duration-200 ${
            selectedLeads.has(lead.id) ? 'ring-2 ring-blue-500 bg-blue-50' : ''
          }`}
          onClick={() => onSelectLead(lead.id)}
        >
          <div className="flex items-start justify-between mb-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleLeadSelect(lead.id);
              }}
              className="hover:bg-blue-100 p-1 rounded transition-colors"
            >
              {selectedLeads.has(lead.id) ? (
                <CheckSquare className="w-4 h-4 text-blue-600" />
              ) : (
                <Square className="w-4 h-4 text-gray-400" />
              )}
            </button>
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveDropdown(activeDropdown === lead.id ? null : lead.id);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded hover:bg-gray-100"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
              
              {activeDropdown === lead.id && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                  <div className="py-2">
                    {hasPermission('edit', lead) && (
                      <button
                        onClick={(e) => handleEdit(lead.id, e)}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 flex items-center transition-colors"
                      >
                        <Edit className="w-4 h-4 mr-3" />
                        Edit Lead
                      </button>
                    )}
                    <button
                      onClick={(e) => handleAddContact(lead.id, e)}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 flex items-center transition-colors"
                    >
                      <UserPlus className="w-4 h-4 mr-3" />
                      Add Contact
                    </button>
                    {hasPermission('delete', lead) && (
                      <>
                        <hr className="my-2" />
                        <button
                          onClick={(e) => handleDelete(lead.id, e)}
                          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center transition-colors"
                        >
                          <Trash2 className="w-4 h-4 mr-3" />
                          Delete Lead
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{lead.name}</h3>
            <div className="space-y-2">
              <div className="flex items-center text-sm text-gray-600">
                <Mail className="w-4 h-4 mr-2" />
                {lead.email}
              </div>
              {lead.phone && (
                <div className="flex items-center text-sm text-gray-600">
                  <Phone className="w-4 h-4 mr-2" />
                  {lead.phone}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Status</span>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(lead.status)}`}>
                {lead.status}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Owner</span>
              <span className="text-sm text-gray-900">{getUserName(lead.assigned_to)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Pipeline</span>
              <span className="text-sm text-gray-900">{getPipelineName(lead.pipeline_id)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Created</span>
              <span className="text-sm text-gray-900">{new Date(lead.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
          <p className="text-gray-600 mt-1">
            {filteredAndSortedLeads.length} leads found
            {selectedLeads.size > 0 && ` • ${selectedLeads.size} selected`}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {/* View Toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'table' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Table
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'cards' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Cards
            </button>
          </div>
          
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center space-x-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Lead</span>
          </button>
        </div>
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

      {/* Filters and Search */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search leads by name, email, or phone..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="all">All Status</option>
                {statusOptions.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-gray-500" />
              <select
                value={filters.assigned_to}
                onChange={(e) => setFilters(prev => ({ ...prev, assigned_to: e.target.value }))}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="all">All Owners</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>
            </div>

            <select
              value={filters.pipeline_id}
              onChange={(e) => setFilters(prev => ({ ...prev, pipeline_id: e.target.value }))}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="all">All Pipelines</option>
              {pipelines.map(pipeline => (
                <option key={pipeline.id} value={pipeline.id}>{pipeline.name}</option>
              ))}
            </select>

            {/* Clear Filters */}
            {(filters.search || filters.status !== 'all' || filters.assigned_to !== 'all' || filters.pipeline_id !== 'all') && (
              <button
                onClick={clearFilters}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1 transition-colors"
              >
                <X className="w-3 h-3" />
                <span>Clear</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {showBulkActions && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-blue-800 font-medium">
              {selectedLeads.size} lead{selectedLeads.size !== 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center space-x-2">
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleBulkAction('status', e.target.value);
                    e.target.value = '';
                  }
                }}
                className="border border-blue-300 rounded-md px-3 py-1 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Change Status</option>
                {statusOptions.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>

              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleBulkAction('assign', e.target.value);
                    e.target.value = '';
                  }
                }}
                className="border border-blue-300 rounded-md px-3 py-1 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Assign To</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>

              <button
                onClick={() => handleBulkAction('delete')}
                className="bg-red-600 text-white px-3 py-1 rounded-md text-sm hover:bg-red-700 transition-colors flex items-center space-x-1"
              >
                <Trash2 className="w-3 h-3" />
                <span>Delete</span>
              </button>
            </div>
          </div>
          <button
            onClick={() => {
              setSelectedLeads(new Set());
              setShowBulkActions(false);
            }}
            className="text-blue-600 hover:text-blue-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading leads...</span>
        </div>
      )}

      {/* Content */}
      {!loading && (
        <>
          {filteredAndSortedLeads.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No leads found</h3>
              <p className="text-gray-500 mb-4">
                {filters.search || filters.status !== 'all' || filters.assigned_to !== 'all' || filters.pipeline_id !== 'all'
                  ? 'Try adjusting your filters or search terms'
                  : 'Get started by creating your first lead'
                }
              </p>
              {(!filters.search && filters.status === 'all' && filters.assigned_to === 'all' && filters.pipeline_id === 'all') && (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Create First Lead
                </button>
              )}
            </div>
          ) : (
            viewMode === 'table' ? renderTableView() : renderCardView()
          )}
        </>
      )}

      {/* Forms and Modals */}
      {showCreateForm && hasPermission('create') && (
        <LeadForm
          onClose={() => setShowCreateForm(false)}
          onSave={() => setShowCreateForm(false)}
        />
      )}

      {showEditForm && editingLeadId && hasPermission('edit', filteredAndSortedLeads.find(l => l.id === editingLeadId)) && (
        <LeadForm
          leadId={editingLeadId}
          onClose={() => {
            setShowEditForm(false);
            setEditingLeadId(null);
          }}
          onSave={() => {
            setShowEditForm(false);
            setEditingLeadId(null);
          }}
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
                <h3 className="text-lg font-semibold text-gray-900">Delete Lead</h3>
              </div>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this lead? This action cannot be undone and will also delete all associated contacts.
              </p>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeletingLeadId(null);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  Delete Lead
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadList;