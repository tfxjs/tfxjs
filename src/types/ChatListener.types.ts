import ChannelChatMessageEventData from './EventSub_Events/ChannelChatMessageEventData.types';

type TorPromiseT<T> = T | Promise<T>;

// Init

export type ChatListenerInstance = ChatListenerExecution;

// Execution

export type ChatListenerExecution = {
    execution: (...args: any[]) => TorPromiseT<any>;
};