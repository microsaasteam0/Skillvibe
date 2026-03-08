'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { API_URL } from '@/lib/api-config';

export interface Conversation {
  id: string;
  chat_id: string;
  other_user_name: string;
  other_user_avatar: string;
  last_message?: string;
  last_message_time?: string;
  unread_count: number;
}

interface MessageContextType {
  conversations: Conversation[];
  totalUnreadCount: number;
  isLoading: boolean;
  error: string | null;
  fetchConversations: () => Promise<void>;
  markAsRead: (chatId: string) => Promise<void>;
}

const MessageContext = createContext<MessageContextType | undefined>(undefined);

export const MessageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConversations = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const token = localStorage.getItem('access_token');
      if (!token) {
        console.log('[MessageContext] No auth token available');
        return;
      }

      const url = `${API_URL}/api/v1/messages/`;
      console.log('[MessageContext] Fetching from:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('[MessageContext] Response status:', response.status);

      if (!response.ok) {
        console.warn('[MessageContext] Failed to fetch messages:', response.status);
        return;
      }

      const data: Conversation[] = await response.json();
      setConversations(data || []);

      // Calculate total unread count
      const total = (data || []).reduce((sum, conv) => sum + (conv.unread_count || 0), 0);
      setTotalUnreadCount(total);
      console.log('[MessageContext] Fetched messages. Total unread:', total, 'Conversations:', data?.length);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error fetching conversations:', errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const markAsRead = useCallback(async (chatId: string) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_URL}/api/v1/messages/${chatId}/read`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        await fetchConversations();
      }
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  }, [fetchConversations]);

  // Fetch conversations on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchConversations();
    }, 500);
    
    return () => clearTimeout(timer);
  }, [fetchConversations]);

  // Poll for new messages every 5 seconds (faster updates)
  useEffect(() => {
    const pollInterval = setInterval(() => {
      fetchConversations();
    }, 5000); // 5 seconds for faster real-time updates

    return () => clearInterval(pollInterval);
  }, [fetchConversations]);

  const value: MessageContextType = {
    conversations,
    totalUnreadCount,
    isLoading,
    error,
    fetchConversations,
    markAsRead,
  };

  return (
    <MessageContext.Provider value={value}>
      {children}
    </MessageContext.Provider>
  );
};

export const useMessages = () => {
  const context = useContext(MessageContext);
  if (context === undefined) {
    // Return a default context instead of throwing
    return {
      conversations: [],
      totalUnreadCount: 0,
      isLoading: false,
      error: null,
      fetchConversations: async () => {},
      markAsRead: async () => {},
    };
  }
  return context;
};
