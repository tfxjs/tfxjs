import axios from 'axios';
import TwitchEventId from '../enums/TwitchEventId.enum';
import { TokenService } from '../services/Token.service';
import { MappedTwitchEventId, TwitchEventData } from '../types/EventSub.types';
import { Logger, LoggerFactory } from '../utils/Logger';
import WebsocketClient from './Websocket.client';
import TwtichPermissionScope from '../enums/TwitchPermissionScope.enum';
import DINames from '../utils/DI.names';
import ConfigService from '../services/Config.service';
import ListenChannelsProvider from '../providers/ListenChannels.provider';
import { ListenChannelSubscriptionResult } from '../types/ListenChannels.provider.types';
import NotFoundError from '../errors/NotFound.error';
import CreateEventSubSubscriptionRequestConfigBuilder, { CreateEventSubSubscriptionResponse } from '../builders/api/CreateEventSubSubscription.request.builder';
import GetEventSubSubscriptionsRequestConfigBuilder, { GetEventSubSubscriptionsResponse } from '../builders/api/GetEventSubSubscriptions.request.builder';
import DeleteEventSubSubscriptionRequestConfigBuilder, { DeleteEventSubSubscriptionResponse } from '../builders/api/DeleteEventSubSubscription.request.builder';
import { UsableToken } from '../types/Token.repository.types';
import { DIContainer } from '../di/Container';

export default class EventSubClient {
    private readonly config: ConfigService;
    private readonly tokenService: TokenService;
    private readonly listenChannelsProvider: ListenChannelsProvider;
    private readonly websocketClient: WebsocketClient;

    private readonly logger: Logger;

    constructor() {
        this.logger = LoggerFactory.createLogger('EventSubClient');

        this.config = DIContainer.get<ConfigService>(DINames.ConfigService);
        this.tokenService = DIContainer.get<TokenService>(DINames.TokenService);
        this.listenChannelsProvider = DIContainer.get<ListenChannelsProvider>(DINames.ListenChannelsProvider);
        this.websocketClient = DIContainer.get<WebsocketClient>(DINames.WebsocketClient);

        this.logger.debug('Initialized');
    }

    // Obsługa kanałów
    async setupChatListeners() {
        this.listenChannelsProvider.onChannelsUpdated(this.listenChannelsProviderCallback.bind(this));
        this.listenChannelsProvider.refreshChannels();
    }

    private async listenChannelsProviderCallback(channels: string[], removedChannels: string[], newChannels: string[]) {
        const failedSubscriptions: ListenChannelSubscriptionResult[] = [];
        const failedUnsubscriptions: ListenChannelSubscriptionResult[] = [];

        const subscribePromises = newChannels.map(async (channel) => {
            this.logger.info(`Subscribing to chat events for channel=${channel}...`);
            return this.listenChat(channel)
                .then((data) => {
                    this.logger.info(`Successfully subscribed to chat events for channel=${channel}`);
                })
                .catch((err) => {
                    this.logger.error(`Failed to subscribe to chat events for channel=${channel} - ${err}`);
                    failedSubscriptions.push({
                        success: false,
                        channel,
                        code: err.response?.status || -1,
                    });
                });
        });

        const unsubscribePromises = removedChannels.map(async (channel) => {
            this.logger.info(`Unsubscribing from chat events for channel=${channel}...`);
            return this.unlistenChat(channel)
                .then((data) => {
                    this.logger.info(`Successfully unsubscribed from chat events for channel=${channel}`);
                })
                .catch((err) => {
                    // unlistenChat działa na zasadzie pytania API o subskrypcje i wybraniu tej, która pasuje do kanału
                    // Jeżeli nie znajdzie subskrypcji, to zwróci NotFoundError
                    // W normalnym przypadku request by zwrócił 404 ale tutaj nawet nie wywołuje się request
                    let code = err.response?.status || -1;
                    let message: string | undefined = undefined;
                    if (code == -1) {
                        if (err instanceof NotFoundError) {
                            code = 404;
                            message = err.message;
                        }
                    }
                    this.logger.error(`Failed to unsubscribe from chat events for channel=${channel} - ${err}`);
                    failedUnsubscriptions.push({
                        success: false,
                        channel,
                        code,
                        message,
                    });
                });
        });

        await Promise.all([...subscribePromises, ...unsubscribePromises]).finally(() => {
            if ([...failedSubscriptions, ...failedUnsubscriptions].length == 0) return;
            this.listenChannelsProvider.handleFailedSubscriptions(failedSubscriptions, failedUnsubscriptions);
        });
    }

    /**
     * Subscribes to an event
     * @param type Event type {@link TwitchEventId}
     * @param condition Event condition {@link TwitchEventData}
     * @param version Event version
     * @param token Access token
     * @returns Result {@link CreateSubscriptionResponse}
     * @throws Error if subscription failed
     */
    private async subscribe<T extends MappedTwitchEventId>(type: T, condition: TwitchEventData<T>['condition'], version: TwitchEventData<T>['version'], token: UsableToken) {
        const sessionId = this.websocketClient.getSessionId();
        if (!sessionId) throw new Error('Websocket session ID not found');
        const requestBuilder = new CreateEventSubSubscriptionRequestConfigBuilder().setClientId(this.config.getClientId()).setAccessToken(token).setType(type).setCondition(condition).setVersion(version).setSessionId(sessionId);
        const requestConfig = requestBuilder.build();
        const response = await axios.request<CreateEventSubSubscriptionResponse>(requestConfig);
        if (!requestBuilder.correctResponseCodes.includes(response.status)) {
            const errorMessage = `Failed to subscribe to event ${type} with condition ${JSON.stringify(condition)}`;
            this.logger.error(errorMessage);
            throw new Error(errorMessage);
        }
        this.logger.debug(`New subscription (${response.data.data[0].id}) to event ${type} with condition ${JSON.stringify(condition)}`);
        return response.data;
    }

    private async list(userId: string, options: {userId?: string, status?: string, type?: MappedTwitchEventId}, after: string | null = null): Promise<GetEventSubSubscriptionsResponse> {
        
        // TODO: Handle pagination

        const userTokenObject = await this.tokenService.getUserTokenById(userId);
        if (!userTokenObject) throw new NotFoundError('User token not found');
        const requestBuilder = new GetEventSubSubscriptionsRequestConfigBuilder().setClientId(this.config.getClientId()).setAccessToken(userTokenObject);
        if(options.userId !== undefined) requestBuilder.setUserId(options.userId);
        if(options.status !== undefined) requestBuilder.setStatus(options.status);
        if(options.type !== undefined) requestBuilder.setType(options.type);
        if(after !== null) requestBuilder.setAfter(after);
        const requestConfig = requestBuilder.build();
        const response = await axios.request<GetEventSubSubscriptionsResponse>(requestConfig);
        if (!requestBuilder.correctResponseCodes.includes(response.status)) {
            const errorMessage = `[${response.status}] Failed to get subscriptions user=${options.userId ? options.userId : '(any)'} type=${options.type ? options.type : '(any)'}, status=${options.status ? options.status : '(any)'} for user ${userId} `;
            this.logger.error(errorMessage);
            throw new Error(errorMessage);
        }
        const data = response.data;
        this.logger.debug(`Got ${data.data.length} subscriptions user=${options.userId ? options.userId : '(any)'} type=${options.type ? options.type : '(any)'}, status=${options.status ? options.status : '(any)'} for user ${userId}`);
        return data;
    }

    /**
     * Unsuscribe from an event
     * @param id Subscription ID
     * @returns True if unsubscribed successfully
     * @throws Error if unsubscription failed
     */
    private async unsubscribe(id: string, token: UsableToken) {
        const requestBuilder = new DeleteEventSubSubscriptionRequestConfigBuilder().setClientId(this.config.getClientId()).setAccessToken(token).setId(id);
        const requestConfig = requestBuilder.build();
        const response = await axios.request<DeleteEventSubSubscriptionResponse>(requestConfig);
        if (!requestBuilder.correctResponseCodes.includes(response.status)) {
            const errorMessage = `[${response.status}] Failed to unsubscribe from event ${id}`;
            this.logger.error(errorMessage);
            throw new Error(errorMessage);
        }
        this.logger.debug(`Unsubscribed from event ${id}`);
        return true;
    }

    // Specyfic methods for events

    /**
     * Subscribes to chat events
     * //TODO
     */
    async listenChat(channelId: string, asUserId: string = this.config.getUserId()) {
        const userTokenObject = await this.tokenService.getUserTokenWithScopesById(asUserId);
        if (!userTokenObject) throw new Error('User token not found');
        /*
        Zależnie od scopeów:
            user:read:chat - Czytanie dowolnego czatu z użyciem tokenu użytkownika
            user:bot - Czytanie dowolnego czatu z użyciem tokenu aplikacji
            channel:bot - Czytanie czatu, gdzie użytkownik jest moderatorem/właścicielem z użyciem tokenu aplikacji
        Jeżeli użytkownik (userId) jest zwykłym uczestnikiem czatu, można użyć:
            (1) user:bot + appAccessToken
            (2) user:read:chat + userAccessToken
        Jeżeli użytkownik (userId) jest moderatorem/właścicielem czatu, można użyć:
            (1) channel:bot + appAccessToken
            (2 - chyba) user:read:chat + userAccessToken
        ALE najlepiej rozwiązać to tak - użytkownik, który jest botem MUSI mieć scope user:bot i channel:bot
        */
        if (!userTokenObject.scopes.includes(TwtichPermissionScope.UserBot)) {
            const errorMessage = `User token does not have required scope user:bot (avaliable scopes: ${userTokenObject.scopes.join(', ')})`;
            this.logger.error(errorMessage);
            throw new Error(errorMessage);
        }
        if (!userTokenObject.scopes.includes(TwtichPermissionScope.ChannelBot)) {
            const errorMessage = `User token does not have required scope channel:bot (avaliable scopes: ${userTokenObject.scopes.join(', ')})`;
            this.logger.error(errorMessage);
            throw new Error(errorMessage);
        }

        return this.subscribe(
            TwitchEventId.ChannelChatMessage,
            {
                broadcaster_user_id: channelId,
                user_id: asUserId,
            },
            1,
            userTokenObject
        );
    }

    /**
     * Unsubscribes from chat events
     * //TODO
     */
    async unlistenChat(channelId: string, asUserId: string = this.config.getUserId()) {
        // TODO: Cache dla subskrypcji
        const data = await this.list(asUserId, { status: 'enabled' });

        const subscription = data.data.filter((sub) => sub.type == TwitchEventId.ChannelChatMessage).find((sub) => sub.condition.broadcaster_user_id == channelId && sub.condition.user_id == asUserId);
        if (!subscription) throw new NotFoundError('Subscription not found');

        const userTokenObject = await this.tokenService.getUserTokenById(asUserId);
        if (!userTokenObject) throw new NotFoundError('User token not found');

        return this.unsubscribe(subscription.id, userTokenObject);
    }
}
