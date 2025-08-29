import React, { createContext, useContext } from 'react';
import { useAuth } from './AuthContext';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Manager' | 'Sales Rep';
  orgId: string;
}

interface UserContextType {
  currentUser: User;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  
  // Convert auth user to legacy user format for backward compatibility
  const currentUser: User = user ? {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    orgId: user.orgId
  } : {
    id: 'user-1',
    name: 'Guest User',
    email: 'guest@example.com',
    role: 'Sales Rep',
    orgId: 'org-1'
  };

  return (
    <UserContext.Provider value={{ currentUser }}>
      {children}
    </UserContext.Provider>
  );
};