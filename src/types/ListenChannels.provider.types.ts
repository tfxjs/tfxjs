export interface IListenChannelsProvider {
    getChannelIds(): Promise<string[]> | string[];
    getRefreshInterval(): number;
}

export type ListenChannelsCallback = (channels: string[], removedChannels: string[], newChannels: string[]) => void;

export type ListenChannelSubscriptionResult = {
    success: boolean;
    channel: string;
    code: number;
    message?: string;
}