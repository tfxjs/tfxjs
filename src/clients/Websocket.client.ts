import { NotificationPayload, RevocationPayload, WebsocketMessage, WebsocketMessageType, WelcomePayload } from "../types/Websocket.types";
import { Logger, LoggerFactory } from "../utils/Logger";
import { WebSocket } from "ws";
import EventSubClient from "./EventSub.client";
import TwitchEventId from "../enums/TwitchEventId.enum";
import ChatCommandsService from "../services/ChatCommands.service";
import ChatListenersService from "../services/ChatListeners.service";
import DINames from "../utils/DI.names";
import { DIContainer } from "../di/Container";

export default class WebsocketClient {
    private readonly logger: Logger;

    private sessionId: string = '';
    private websocketClient: WebSocket | null = null;

    private _chatCommandsService?: ChatCommandsService;
    private _chatListenersService?: ChatListenersService;

    constructor() {
        this.logger = LoggerFactory.createLogger('WebsocketClient');
        this._connect();
        
        this.logger.debug('Initialized');
    }

    private get chatCommandsService(): ChatCommandsService | undefined {
        if (!this._chatCommandsService) {
            if(DIContainer.isBound(DINames.ChatCommandsService)) {
                this.logger.debug('ChatCommandsService found in container');
                this._chatCommandsService = DIContainer.get(DINames.ChatCommandsService);
            } else {
                this.logger.debug('ChatCommandsService not found in container. Skipping...');
            }
        }
        return this._chatCommandsService;
    }

    private get chatListenersService(): ChatListenersService | undefined {
        if (!this._chatListenersService) {
            if(DIContainer.isBound(DINames.ChatListenersService)) {
                this.logger.debug('ChatListenersService found in container');
                this._chatListenersService = DIContainer.get(DINames.ChatListenersService);
            } else {
                this.logger.debug('ChatListenersService not found in container. Skipping...');
            }
        }
        return this._chatListenersService;
    }

    // Keepalive
    private lastKeepAliveTimestamp: number = 0;
    private keepAliveIntervalMs: number = 0;
    // Milliseconds offset for keepalive check (eg.: 5s interval, 2s offset -> check if lastKeepAliveTimestamp is greater than 7s)
    private readonly keepAliveIntervalMsOffset = 2000;
    private keepAliveInterval: NodeJS.Timeout | null = null;

    getSessionId() : string | null {
        return this.sessionId ? this.sessionId : null;
    }

    private updateKeepAliveTimestamp() {
        this.lastKeepAliveTimestamp = Date.now();
    }

    private readonly reconnectOnTimeout = true;
    private setupKeepAlive(keepAliveIntervalMs: number) {
        if (this.keepAliveInterval !== null) clearInterval(this.keepAliveInterval);
        this.updateKeepAliveTimestamp(); // Set initial timestamp
        this.keepAliveIntervalMs = keepAliveIntervalMs; // Keepalive means that server expects a message every X seconds
        this.keepAliveInterval = setInterval(() => {
            const currentTimestamp = Date.now();
            const difference = currentTimestamp - this.lastKeepAliveTimestamp;
            this.logger.debug(`Checking WebSocket keepalive (Last keepalive: ${difference}/${this.keepAliveIntervalMs + this.keepAliveIntervalMsOffset}ms)`);
            if (difference > this.keepAliveIntervalMs + this.keepAliveIntervalMsOffset) {
                this.logger.warn(`WebSocket connection keepalive timeout.${this.reconnectOnTimeout ? ' Reconnecting...' : ''}`);
                if(this.reconnectOnTimeout) this._connect(true);
                return;
            }
        }, this.keepAliveIntervalMs / 2); // Check every half of the keepalive interval (eg.: 5s interval -> check every 2.5s)
    }
    
    // Connection

    private readonly reconnectTimeout = 5000;
    private readonly reconnectOnClose = true;
    private readonly reconnectOnError = true;
    private _connect(forceReconnect: boolean = false) {
        if(!forceReconnect && this.websocketClient != null) throw new Error('Already connected to EventSub WebSocket');
        if(this.websocketClient != null) this._disconnect();
        this.websocketClient = new WebSocket('wss://eventsub.wss.twitch.tv/ws');

        this.websocketClient.on('open', () => {
            this.logger.info('Connected to EventSub WebSocket');
        });

        this.websocketClient.on('message', (data) => {
            const messageReadable = data.toString('utf8');
            // logger.log(messageReadable);
            const message = JSON.parse(messageReadable);
            this.handleWebSocketMessage(message);
        });

        this.websocketClient.on('close', () => {
            this.logger.warn('Disconnected from EventSub WebSocket');
            this._disconnect();
            if (this.reconnectOnClose) setTimeout(() => this.connect(), this.reconnectTimeout);
        });

        this.websocketClient.on('error', (err) => {
            this.logger.error(JSON.stringify(err));
            this._disconnect();
            if (this.reconnectOnError) setTimeout(() => this.connect(), this.reconnectTimeout);
        });
    }

    private _disconnect() {
        if (this.websocketClient == null) return;
        if (this.keepAliveInterval != null) clearTimeout(this.keepAliveInterval);
        this.websocketClient.close();
        this.websocketClient = null;
    }

    // Public

    public connect() {
        try {
            this._connect();
        } catch (e) {
            this.logger.error(JSON.stringify(e));
            return false;
        }
        return true;
    }

    // Message handling

    private handleWebSocketMessage(websocketMessage: WebsocketMessage<any>) {
        const messageType = websocketMessage.metadata.message_type;

        if (messageType === WebsocketMessageType.Welcome) return this.handleWelcomeMessage(websocketMessage);
        if (messageType === WebsocketMessageType.Notification) return this.handleNotification(websocketMessage);
        if (messageType === WebsocketMessageType.Revocation) return this.handleRevocation(websocketMessage);
        if (messageType === WebsocketMessageType.Close) return this.handleClose(websocketMessage);
        if (messageType === WebsocketMessageType.KeepAlive) return this.handleKeepAlive(websocketMessage);
    }
    
    private handleWelcomeMessage(welcomeMessage: WebsocketMessage<WelcomePayload>) {
        const websocketWelcome = welcomeMessage as WebsocketMessage<WelcomePayload>;
        
        this.sessionId = websocketWelcome.payload.session.id;
        this.logger.info(`Received welcome message. Session ID: ${this.sessionId}`);

        const EventSubClient = DIContainer.get(DINames.EventSubClient) as EventSubClient;
        EventSubClient.setupChatListeners();

        this.setupKeepAlive(websocketWelcome.payload.session.keepalive_timeout_seconds * 1000);
        return;
    }

    private handleNotification(websocketNotification: WebsocketMessage<NotificationPayload>) {
        this.updateKeepAliveTimestamp();

        const notification = websocketNotification.payload;
        this.logger.debug(`Received notification ${notification.subscription.type} from subscription ID ${notification.subscription.id}`);

        if(notification.subscription.type == TwitchEventId.ChannelChatMessage) {
            if (this.chatCommandsService) this.chatCommandsService.handleCommand(notification.event);
            if (this.chatListenersService) this.chatListenersService.handleListener(notification.event);
        }

        return;
    }

    private handleRevocation(revocationMessage: WebsocketMessage<RevocationPayload>) {
        this.logger.debug(`Received revocation message. Subscription ID: ${revocationMessage.payload.subscription.id} (Type: ${revocationMessage.payload.subscription.type})`);
        return;
    }

    private handleClose(closeMessage: WebsocketMessage<any>) {
        this.logger.debug(`Received close message.`);
        if (this.keepAliveInterval !== null) clearInterval(this.keepAliveInterval);
        return;
    }

    private handleKeepAlive(keepAliveMessage: WebsocketMessage<any>) {
        this.logger.debug(`Received keepalive message.`);
        this.updateKeepAliveTimestamp();
        return;
    }

}