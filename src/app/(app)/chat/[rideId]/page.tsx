
'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser, useFirestore, useDoc, useCollection } from '@/firebase';
import { doc, collection, query, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import type { Ride, UserProfile, ChatMessage } from '@/lib/schemas';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { placeholderImages } from '@/lib/placeholder-images';

function ChatPage() {
    const { rideId } = useParams();
    const router = useRouter();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const [newMessage, setNewMessage] = React.useState('');
    const messagesEndRef = React.useRef<null | HTMLDivElement>(null);

    const rideRef = React.useMemo(() => {
        if (!firestore || !rideId) return null;
        return doc(firestore, 'rides', rideId as string);
    }, [firestore, rideId]);
    const { data: ride, isLoading: isRideLoading } = useDoc<Ride>(rideRef);

    const otherParticipantId = React.useMemo(() => {
        if (!ride || !user) return null;
        return ride.driverId === user.uid ? ride.passengerId : ride.driverId;
    }, [ride, user]);

    const otherParticipantRef = React.useMemo(() => {
        if (!firestore || !otherParticipantId) return null;
        return doc(firestore, 'users', otherParticipantId);
    }, [firestore, otherParticipantId]);
    const { data: otherParticipant, isLoading: isParticipantLoading } = useDoc<UserProfile>(otherParticipantRef);

    const messagesQuery = React.useMemo(() => {
        if (!firestore || !rideId) return null;
        return query(collection(firestore, 'rides', rideId as string, 'messages'), orderBy('createdAt', 'asc'));
    }, [firestore, rideId]);
    const { data: messages, isLoading: areMessagesLoading } = useCollection<ChatMessage>(messagesQuery);

    React.useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !firestore || !rideId || !newMessage.trim()) return;

        const messagesCollectionRef = collection(firestore, 'rides', rideId as string, 'messages');
        try {
            await addDoc(messagesCollectionRef, {
                senderId: user.uid,
                text: newMessage.trim(),
                createdAt: serverTimestamp(),
            });
            setNewMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
            // Optionally add a toast notification for the error
        }
    };
    
    const isLoading = isUserLoading || isRideLoading || isParticipantLoading;

    if (isLoading) {
        return (
            <div className="flex flex-col h-[calc(100vh-60px)] max-w-4xl mx-auto my-4">
                <header className="flex items-center gap-4 border-b p-4 bg-card">
                     <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-1">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-4 w-24" />
                    </div>
                </header>
                <div className="flex-1 p-4 space-y-4 bg-card">
                    <Skeleton className="h-12 w-3/4 rounded-lg" />
                    <Skeleton className="h-12 w-3/4 rounded-lg ml-auto" />
                    <Skeleton className="h-12 w-3/4 rounded-lg" />
                </div>
                <footer className="border-t p-4 bg-card">
                    <Skeleton className="h-10 w-full" />
                </footer>
            </div>
        );
    }
    
    // Security check: ensure user is part of the ride and ride is active
    if (!isRideLoading && ride && user && (!ride.participantIds.includes(user.uid) || !['accepted', 'confirmed'].includes(ride.status))) {
        router.push('/dashboard');
        return <p>Access Denied.</p>;
    }

    return (
        <Card className="flex flex-col h-[calc(100vh-90px)] max-w-4xl mx-auto my-4">
            <CardHeader className="flex flex-row items-center gap-4 border-b">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5"/>
                    <span className="sr-only">Back</span>
                </Button>
                 <Avatar className="h-10 w-10">
                    <AvatarImage src={(otherParticipant as any)?.photoURL || placeholderImages.find(p=>p.id === 'avatar1')?.imageUrl}/>
                    <AvatarFallback>{otherParticipant?.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <CardTitle className="text-lg">{otherParticipant?.name}</CardTitle>
                    <CardDescription>Chat for ride to {ride?.toLocation}</CardDescription>
                </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                {areMessagesLoading && <p>Loading messages...</p>}
                {messages && messages.length === 0 && (
                    <div className="text-center text-muted-foreground pt-10">
                        No messages yet. Start the conversation!
                    </div>
                )}
                {messages?.map(msg => (
                    <div key={msg.id} className={cn('flex items-end gap-2', msg.senderId === user?.uid ? 'justify-end' : 'justify-start')}>
                        <div className={cn(
                            'max-w-xs md:max-w-md rounded-lg p-3 text-sm break-words',
                            msg.senderId === user?.uid 
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                        )}>
                            <p>{msg.text}</p>
                            <p className={cn(
                                'text-xs mt-1', 
                                msg.senderId === user?.uid 
                                    ? 'text-primary-foreground/70 text-right'
                                    : 'text-muted-foreground text-right'
                            )}>
                                {msg.createdAt?.toDate ? format(msg.createdAt.toDate(), 'p') : 'sending...'}
                            </p>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </CardContent>
            <form onSubmit={handleSendMessage} className="border-t p-4 flex items-center gap-2">
                <Input 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    autoComplete="off"
                />
                <Button type="submit" size="icon" disabled={!newMessage.trim()}>
                    <Send className="h-5 w-5"/>
                    <span className="sr-only">Send</span>
                </Button>
            </form>
        </Card>
    );
}

export default ChatPage;
