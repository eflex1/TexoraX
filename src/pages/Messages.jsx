import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useLanguage } from '@/lib/LanguageContext';
import PageHeader from '@/components/shared/PageHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, MessageSquare, Search, Circle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function Messages() {
  const { user } = useCurrentUser();
  const { t } = useLanguage();
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [selectedContact, setSelectedContact] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchContacts, setSearchContacts] = useState('');
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: users = [] } = useQuery({
    queryKey: ['users-for-messaging'],
    queryFn: () => base44.entities.User.list('-created_date', 200),
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['messages', selectedChannel],
    queryFn: () => selectedChannel
      ? base44.entities.Message.filter({ channel_id: selectedChannel }, 'created_date', 200)
      : [],
    enabled: !!selectedChannel,
    refetchInterval: 3000,
  });

  // Real-time subscription
  useEffect(() => {
    if (!selectedChannel) return;
    const unsubscribe = base44.entities.Message.subscribe((event) => {
      if (event.data?.channel_id === selectedChannel) {
        queryClient.invalidateQueries({ queryKey: ['messages', selectedChannel] });
      }
    });
    return unsubscribe;
  }, [selectedChannel, queryClient]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMutation = useMutation({
    mutationFn: (msg) => base44.entities.Message.create(msg),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', selectedChannel] });
      setNewMessage('');
    },
  });

  const contacts = users.filter(u => u.email !== user?.email &&
    (!searchContacts || u.full_name?.toLowerCase().includes(searchContacts.toLowerCase()) || u.email?.toLowerCase().includes(searchContacts.toLowerCase()))
  );

  const getChannelId = (contactEmail) => {
    const sorted = [user?.email, contactEmail].sort();
    return `dm_${sorted.join('_')}`;
  };

  const selectContact = (contact) => {
    setSelectedContact(contact);
    setSelectedChannel(getChannelId(contact.email));
  };

  const handleSend = () => {
    if (!newMessage.trim() || !selectedChannel) return;
    sendMutation.mutate({
      channel_id: selectedChannel,
      channel_type: 'direct',
      sender_email: user?.email,
      sender_name: user?.full_name,
      content: newMessage.trim(),
      recipient_email: selectedContact?.email,
    });
  };

  const roleColors = {
    admin: 'bg-violet-100 text-violet-700',
    reviewer: 'bg-sky-100 text-sky-700',
    donor: 'bg-amber-100 text-amber-700',
    applicant: 'bg-emerald-100 text-emerald-700',
  };

  return (
    <div className="space-y-4">
      <PageHeader title={t('messages')} description="Real-time direct messaging" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-220px)]">
        {/* Contacts panel */}
        <Card className="md:col-span-1 flex flex-col overflow-hidden">
          <div className="p-3 border-b shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search..." value={searchContacts} onChange={e => setSearchContacts(e.target.value)} className="pl-9 h-9" />
            </div>
          </div>
          <ScrollArea className="flex-1">
            {contacts.map(c => {
              const channelId = getChannelId(c.email);
              const isSelected = selectedChannel === channelId;
              return (
                <button key={c.id} onClick={() => selectContact(c)}
                  className={cn("w-full flex items-center gap-3 p-3 hover:bg-muted/60 transition-colors text-left border-b border-gray-50 last:border-0",
                    isSelected && "bg-primary/5 border-l-2 border-l-primary"
                  )}>
                  <div className="relative">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className={cn("text-xs font-semibold", roleColors[c.role] || 'bg-gray-100')}>
                        {c.full_name?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{c.full_name || c.email}</p>
                    <p className="text-xs text-muted-foreground capitalize">{c.role}</p>
                  </div>
                </button>
              );
            })}
            {contacts.length === 0 && (
              <p className="text-xs text-center text-muted-foreground py-8">No contacts found</p>
            )}
          </ScrollArea>
        </Card>

        {/* Chat panel */}
        <Card className="md:col-span-2 flex flex-col overflow-hidden">
          {selectedChannel && selectedContact ? (
            <>
              {/* Chat header */}
              <div className="p-3 border-b flex items-center gap-3 shrink-0 bg-gray-50">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className={cn("text-xs font-semibold", roleColors[selectedContact.role] || 'bg-gray-100')}>
                    {selectedContact.full_name?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold">{selectedContact.full_name || selectedContact.email}</p>
                  <p className="text-xs text-muted-foreground capitalize">{selectedContact.role}</p>
                </div>
              </div>

              <ScrollArea className="flex-1 p-4">
                <div className="space-y-3">
                  {messages.map(msg => {
                    const isMe = msg.sender_email === user?.email;
                    return (
                      <div key={msg.id} className={cn("flex gap-2", isMe ? "justify-end" : "justify-start")}>
                        {!isMe && (
                          <Avatar className="h-6 w-6 shrink-0 mt-1">
                            <AvatarFallback className="text-[10px]">{selectedContact.full_name?.[0] || 'U'}</AvatarFallback>
                          </Avatar>
                        )}
                        <div className={cn("max-w-[70%]")}>
                          <div className={cn("rounded-2xl px-3.5 py-2",
                            isMe ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted rounded-bl-sm"
                          )}>
                            <p className="text-sm leading-relaxed">{msg.content}</p>
                          </div>
                          <p className={cn("text-[10px] mt-0.5 text-muted-foreground", isMe ? "text-right" : "text-left")}>
                            {format(new Date(msg.created_date), 'HH:mm')}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  {messages.length === 0 && (
                    <p className="text-center text-xs text-muted-foreground py-8">No messages yet. Say hi! 👋</p>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              <div className="p-3 border-t flex gap-2 shrink-0">
                <Input
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder={t('type_message')}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  className="flex-1"
                />
                <Button size="icon" onClick={handleSend} disabled={!newMessage.trim()} className="shrink-0">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 text-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                <MessageSquare className="h-7 w-7 text-primary" />
              </div>
              <div>
                <p className="font-medium text-gray-700">Your messages</p>
                <p className="text-sm text-muted-foreground">{t('select_contact')}</p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}