import { MockWebSocket } from '../../mocks/Websocket.mock';
import { loggerMock } from '../../mocks/Logger.mock';

jest.mock('ws', () => ({
    WebSocket: MockWebSocket,
}));

jest.mock('../../../src/utils/Logger', () => ({
    LoggerFactory: {
        createLogger: jest.fn(() => loggerMock),
    },
}));

import { Container} from '@inversifyjs/container'
import WebsocketClient from '../../../src/clients/Websocket.client';
import DINames from '../../../src/utils/DI.names';
import { WebsocketMessageType } from '../../../src/types/Websocket.types';
import TwitchEventId from '../../../src/enums/TwitchEventId.enum';

describe('WebsocketClient: Handle ChannelChatMessage event', () => {
    let websocketClient: WebsocketClient;
    let chatCommandsService: any;
    let chatListenersService: any;

    beforeEach(() => {
        chatCommandsService = {
            handleCommand: jest.fn(),
        };
        chatListenersService = {
            handleListener: jest.fn(),
        };

        jest.spyOn(Container.prototype, 'isBound').mockReturnValue(true);
        jest.spyOn(Container.prototype, 'get').mockImplementation((id: any) => {
            if (id === DINames.ChatCommandsService) return chatCommandsService;
            if (id === DINames.ChatListenersService) return chatListenersService;
            if (id === DINames.EventSubClient) return { setupChatListeners: jest.fn() };
            return null;
        });

        websocketClient = new WebsocketClient();
    });

    afterEach(() => {
        jest.clearAllMocks();
        if (websocketClient['keepAliveInterval']) {
            clearInterval(websocketClient['keepAliveInterval']);
        }
    });

    it('should call ChatCommandsService handleCommand method (module configured)', () => {
        jest.spyOn(Container.prototype, 'get').mockImplementation((id: any) => {
            if (id === DINames.ChatCommandsService) return chatCommandsService;
            return undefined;
        });
        const notificationMessage = {
            metadata: { message_type: WebsocketMessageType.Notification },
            payload: {
                subscription: { id: 'sub-id', type: TwitchEventId.ChannelChatMessage },
            },
        };
        websocketClient['handleNotification'](notificationMessage as any);
        expect(chatCommandsService.handleCommand).toHaveBeenCalled();
    });

    it('should call ChatListenersService handleListener method (module configured)', () => {
        jest.spyOn(Container.prototype, 'get').mockImplementation((id: any) => {
            if (id === DINames.ChatListenersService) return chatListenersService;
            return undefined;
        });
        const notificationMessage = {
            metadata: { message_type: WebsocketMessageType.Notification },
            payload: {
                subscription: { id: 'sub-id', type: TwitchEventId.ChannelChatMessage },
            },
        };
        websocketClient['handleNotification'](notificationMessage as any);
        expect(chatListenersService.handleListener).toHaveBeenCalled();
    });

    it('should not call ChatListenersService handleListener method (module not configured)', () => {
        jest.spyOn(Container.prototype, 'get').mockReturnValue(undefined);
        const notificationMessage = {
            metadata: { message_type: WebsocketMessageType.Notification },
            payload: {
                subscription: { id: 'sub-id', type: TwitchEventId.ChannelChatMessage },
            },
        };
        websocketClient['handleNotification'](notificationMessage as any);
        expect(chatListenersService.handleListener).not.toHaveBeenCalled();
    });

    it('should not call ChatCommandsService handleCommand method (module not configured)', () => {
        jest.spyOn(Container.prototype, 'get').mockReturnValue(undefined);
        const notificationMessage = {
            metadata: { message_type: WebsocketMessageType.Notification },
            payload: {
                subscription: { id: 'sub-id', type: TwitchEventId.ChannelChatMessage },
            },
        };
        websocketClient['handleNotification'](notificationMessage as any);
        expect(chatCommandsService.handleCommand).not.toHaveBeenCalled();
    });
});
