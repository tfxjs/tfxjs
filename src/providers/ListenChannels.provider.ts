import Container from 'typedi';
import { IListenChannelsProvider, ListenChannelsCallback, ListenChannelSubscriptionResult } from '../types/ListenChannels.provider.types';
import DINames from '../utils/DI.names';
import { Logger, LoggerFactory } from '../utils/Logger';
import ConfigService from '../services/Config.service';

export default class ListenChannelsProvider {
    private readonly channelProvider: IListenChannelsProvider;
    private readonly config: ConfigService;

    private readonly logger: Logger;
    private _lastChannelIds: string[] = [];

    constructor() {
        this.logger = LoggerFactory.createLogger('ListenChannelsProvider');

        this.channelProvider = Container.get<IListenChannelsProvider>(DINames.UserDefinedListenChannelsProvider);
        this.config = Container.get<ConfigService>(DINames.ConfigService);

        this.setupRefreshInterval();
        this.setupApiCheckInterval();

        this.logger.debug('Initialized');
    }

    // Interval for refreshing channels
    private refreshIntervalLoop: NodeJS.Timeout | null = null;
    private setupRefreshInterval(): void {
        this.refreshIntervalLoop = setInterval(() => {
            this.logger.debug(`Interval for refreshing channels`);
            this.refreshChannels();
        }, this.channelProvider.getRefreshInterval());
    }

    // Interval for API check (TODO)
    private apiCheckInterval: NodeJS.Timeout | null = null;
    private setupApiCheckInterval(): void {
        const apiCheckDelay = this.channelProvider.getRefreshInterval() / 2;
        setTimeout(() => {
            if(this.apiCheckInterval) clearInterval(this.apiCheckInterval);
            const apiCheckInterval = this.channelProvider.getRefreshInterval() * 4;
            this.apiCheckInterval = setInterval(() => {
                this.logger.debug(`Interval for API check`);
                this.APICheckChannels();
            }, apiCheckInterval);
        }, apiCheckDelay);
    }

    /**
     * Get channel ids (including bot's user id)
     * @returns List of channel ids
     */
    async getChannelIds(): Promise<string[]> {
        const channels = await this.channelProvider.getChannelIds();
        const botUserId = this.config.getConfig().userId;
        if(!channels.includes(botUserId)) 
            channels.push(botUserId);
        return channels;
    }

    // TODO: Wystaw do użycia - rozwiązuje to jeden feature z issue #2 https://github.com/tfxjs/tfxjs/issues/2
    /**
     * Refresh channels and emit event if there are any changes
     * @returns True if channels were updated, false otherwise
     */
    async refreshChannels(): Promise<boolean> {
        this.logger.info('Refreshing channels');
        const channelIds = await this.getChannelIds();
        const lastChannelIds = this._lastChannelIds;

        const anyChanges =
            // Check if the length of the arrays is different
            channelIds.length !== lastChannelIds.length ||
            // Check if any of the channelIds is not in the lastChannelIds
            channelIds.some((channelId) => !lastChannelIds.includes(channelId)) ||
            // Check if any of the lastChannelIds is not in the channelIds
            lastChannelIds.some((channelId) => !channelIds.includes(channelId));

        if (!anyChanges) {
            this.logger.debug('No differences in channels');
            return false;
        }

        this.logger.debug('Detected differences in channels');
        this.emitChannelsUpdated(channelIds);
        return true;
    }

    private APICheckChannels(): void {
        // TODO : Implementacja sprawdzania poprawności lokalnego stanu "this._lastChannelIds" z wykorzystaniem API
        // Do ogarnięcia jak będzie builder dla API
    }

    /**
     * Handle failed subscriptions and unsubscriptions
     * @param failedSubscriptions List of failed subscriptions {@link ListenChannelSubscriptionResult}
     * @param failedUnsubscriptions List of failed unsubscriptions {@link ListenChannelSubscriptionResult}
     */
    handleFailedSubscriptions(failedSubscriptions: ListenChannelSubscriptionResult[], failedUnsubscriptions: ListenChannelSubscriptionResult[]): void {
        // https://dev.twitch.tv/docs/api/reference/#create-eventsub-subscription
        // Kody: (202/400/401/403/409/429)
        this._lastChannelIds = this._lastChannelIds.filter((channel) => !failedSubscriptions.map(f => f.channel).includes(channel));
        if (failedSubscriptions.length > 0) {
            const getDesc = (code: number) => {
                switch (code) {
                    case 400: return 'Bad request: Request was malformed or missing fields';
                    case 401: return 'Unauthorized: Access token is missing or invalid';
                    case 403: return 'Forbidden: Missing required scope';
                    case 409: return 'Conflict: Subscription with this conditions already exists';
                    case 429: return 'Too many requests: Exceeded subscription limit (type+condition combination)';
                    default: return 'Unknown';
                }
            };
            const lines = failedSubscriptions.map(fs => `${fs.channel} (${fs.code}: ${getDesc(fs.code)})`);
            this.logger.warn(`Failed subscriptions:`);
            lines.forEach((line) => this.logger.warn(`- ${line}`));
        }

        // https://dev.twitch.tv/docs/api/reference/#delete-eventsub-subscription
        // Kody: (204, 400, 401, 404)
        if (failedUnsubscriptions.length > 0) {
            const getDesc = (code: number) => {
                switch (code) {
                    case 400: return 'Bad request: Request was malformed or missing fields';
                    case 401: return 'Unauthorized: Access token is missing or invalid';
                    case 404: return 'Not found: Subscription not found';
                    default: return 'Unknown';
                }
            };
            const lines = failedUnsubscriptions.map(fs => `${fs.channel} (${fs.code}: ${getDesc(fs.code)})`);
            this.logger.warn(`Failed unsubscriptions:`);
            lines.forEach((line) => this.logger.warn(`- ${line}`));
        }
    }

    // Observer pattern
    private callbacks: ListenChannelsCallback[] = [];

    private emitChannelsUpdated(channels: string[]): void {
        const newChannels = channels.filter((channel) => !this._lastChannelIds.includes(channel));
        const removedChannels = this._lastChannelIds.filter((channel) => !channels.includes(channel));
        this._lastChannelIds = channels;
        this.logger.info(`Channels updated: All[${channels.length}] (New[${newChannels.length}], Removed[${removedChannels.length}])`);
        this.callbacks.forEach((callback) => callback(channels, removedChannels, newChannels));
    }

    onChannelsUpdated(callback: ListenChannelsCallback): void {
        this.callbacks.push(callback);
        this.logger.debug(`Added callback`);
    }

    offChannelsUpdated(callback: ListenChannelsCallback): void {
        this.callbacks = this.callbacks.filter((cb) => cb !== callback);
        this.logger.debug(`Removed callback`);
    }
}

export function GetListenerChannelsRefreshFunction(): typeof ListenChannelsProvider.prototype.refreshChannels {
    const provider = Container.get(DINames.ListenChannelsProvider) as ListenChannelsProvider;
    return provider.refreshChannels.bind(provider);
}