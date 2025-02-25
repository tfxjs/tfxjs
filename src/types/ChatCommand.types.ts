import ChannelChatMessageEventData from './EventSub_Events/ChannelChatMessageEventData.types';

type TorPromiseT<T> = T | Promise<T>;

// Init

export type ChatCommandInstance = ChatCommandExecutionGuard & ChatCommandPreExecution & ChatCommandExecution & ChatCommandPostExecution;

// Guard

export type ChatCommandExecutionGuard = {
    guard: (...args: any[]) => TorPromiseT<ChatCommandExecutionGuardAvaliableResults>;
};

export type ChatCommandExecutionGuardAvaliableResults = ChatCommandExecutionGuardBlockResult | ChatCommandExecutionGuardPassResult;

export type ChatCommandExecutionGuardBlockResult = {
    canAccess: false;
    message?: string;
};

export type ChatCommandExecutionGuardPassResult = {
    canAccess: true;
};

// Execution

export type ChatCommandPreExecution = {
    preExecution: (...args: any[]) => TorPromiseT<any>;
};

export type ChatCommandExecution = {
    execution: (...args: any[]) => TorPromiseT<any>;
};

export type ChatCommandPostExecution = {
    postExecution: (...args: any[]) => TorPromiseT<any>;
};