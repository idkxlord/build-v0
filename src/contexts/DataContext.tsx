import React, { createContext, useContext, useState } from 'react';

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'New' | 'Contacted' | 'Qualified' | 'Lost' | 'Won';
  stageId: string;
  pipelineId: string;
  assignedTo: string;
  orgId: string;
  customFields: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Contact {
  id: string;
  leadId: string;
  name: string;
  email: string;
  phone: string;
  designation: string;
  notes: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Pipeline {
  id: string;
  name: string;
  stages: Stage[];
}

export interface Stage {
  id: string;
  name: string;
  order: number;
}

interface DataContextType {
  leads: Lead[];
  contacts: Contact[];
  pipelines: Pipeline[];
  users: Array<{ id: string; name: string; role: string }>;
  addLead: (lead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateLead: (id: string, updates: Partial<Lead>) => void;
  deleteLead: (id: string) => void;
  addContact: (contact: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>) => void;
  getLeadById: (id: string) => Lead | undefined;
  getContactsByLeadId: (leadId: string) => Contact[];
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pipelines] = useState<Pipeline[]>([
    {
      id: 'pipeline-1',
      name: 'Sales Pipeline',
      stages: [
        { id: 'stage-1', name: 'Prospect', order: 1 },
        { id: 'stage-2', name: 'Qualified', order: 2 },
        { id: 'stage-3', name: 'Demo', order: 3 },
        { id: 'stage-4', name: 'Proposal', order: 4 },
        { id: 'stage-5', name: 'Closed', order: 5 }
      ]
    }
  ]);

  const [users] = useState([
    { id: 'user-1', name: 'John Smith', role: 'Manager' },
    { id: 'user-2', name: 'Sarah Johnson', role: 'Sales Rep' },
    { id: 'user-3', name: 'Mike Wilson', role: 'Sales Rep' },
    { id: 'user-4', name: 'Emma Davis', role: 'Admin' }
  ]);

  const [leads, setLeads] = useState<Lead[]>([
    {
      id: 'lead-1',
      name: 'Mohammed Yousuf',
      email: 'yousuf@example.com',
      phone: '+911234567890',
      status: 'New',
      stageId: 'stage-1',
      pipelineId: 'pipeline-1',
      assignedTo: 'user-2',
      orgId: 'org-1',
      customFields: {
        Industry: 'Retail',
        Source: 'LinkedIn',
        Budget: '$50,000'
      },
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01')
    },
    {
      id: 'lead-2',
      name: 'Aarav Sinha',
      email: 'aarav@client.com',
      phone: '+911234560987',
      status: 'Qualified',
      stageId: 'stage-2',
      pipelineId: 'pipeline-1',
      assignedTo: 'user-1',
      orgId: 'org-1',
      customFields: {
        Industry: 'Technology',
        Source: 'Website',
        Budget: '$75,000'
      },
      createdAt: new Date('2025-01-02'),
      updatedAt: new Date('2025-01-05')
    },
    {
      id: 'lead-3',
      name: 'Priya Sharma',
      email: 'priya@business.com',
      phone: '+911234567123',
      status: 'Contacted',
      stageId: 'stage-2',
      pipelineId: 'pipeline-1',
      assignedTo: 'user-3',
      orgId: 'org-1',
      customFields: {
        Industry: 'Healthcare',
        Source: 'Referral',
        Budget: '$100,000'
      },
      createdAt: new Date('2025-01-03'),
      updatedAt: new Date('2025-01-06')
    }
  ]);

  const [contacts, setContacts] = useState<Contact[]>([
    {
      id: 'contact-1',
      leadId: 'lead-1',
      name: 'Mohammed Yousuf',
      email: 'yousuf@example.com',
      phone: '+911234567890',
      designation: 'Business Owner',
      notes: 'Primary decision maker',
      createdBy: 'user-2',
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01')
    },
    {
      id: 'contact-2',
      leadId: 'lead-2',
      name: 'Aarav Sinha',
      email: 'aarav@client.com',
      phone: '+911234560987',
      designation: 'IT Manager',
      notes: 'Technical evaluator',
      createdBy: 'user-1',
      createdAt: new Date('2025-01-02'),
      updatedAt: new Date('2025-01-02')
    },
    {
      id: 'contact-3',
      leadId: 'lead-2',
      name: 'Rohit Kumar',
      email: 'rohit@client.com',
      phone: '+911234560988',
      designation: 'CTO',
      notes: 'Final approver for technical decisions',
      createdBy: 'user-1',
      createdAt: new Date('2025-01-03'),
      updatedAt: new Date('2025-01-03')
    }
  ]);

  const addLead = (leadData: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newLead: Lead = {
      ...leadData,
      id: `lead-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    setLeads(prev => [...prev, newLead]);
  };

  const updateLead = (id: string, updates: Partial<Lead>) => {
    setLeads(prev => prev.map(lead => 
      lead.id === id 
        ? { ...lead, ...updates, updatedAt: new Date() }
        : lead
    ));
  };

  const deleteLead = (id: string) => {
    setLeads(prev => prev.filter(lead => lead.id !== id));
    setContacts(prev => prev.filter(contact => contact.leadId !== id));
  };

  const addContact = (contactData: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newContact: Contact = {
      ...contactData,
      id: `contact-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    setContacts(prev => [...prev, newContact]);
  };

  const getLeadById = (id: string): Lead | undefined => {
    return leads.find(lead => lead.id === id);
  };

  const getContactsByLeadId = (leadId: string): Contact[] => {
    return contacts.filter(contact => contact.leadId === leadId);
  };

  return (
    <DataContext.Provider value={{
      leads,
      contacts,
      pipelines,
      users,
      addLead,
      updateLead,
      deleteLead,
      addContact,
      getLeadById,
      getContactsByLeadId
    }}>
      {children}
    </DataContext.Provider>
  );
};