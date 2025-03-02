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

import WebsocketClient from '../../../src/clients/Websocket.client';
import DINames from '../../../src/utils/DI.names';
import { WebsocketMessageType } from '../../../src/types/Websocket.types';
import { Container } from '@inversifyjs/container';

describe('WebsocketClient: Handle methods', () => {
    let websocketClient: WebsocketClient;

    beforeEach(() => {
        jest.spyOn(Container.prototype, 'isBound').mockReturnValue(true);
        jest.spyOn(Container.prototype, 'get').mockImplementation((id: any) => {
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

    it('should handle welcome message', () => {
        jest.spyOn(websocketClient as any, 'handleWelcomeMessage');

        const connectionId = 'connection-id';
        const keepaliveTimeout = 60;
        const welcommeMessage = {
            metadata: { message_type: WebsocketMessageType.Welcome },
            payload: { session: { id: connectionId, keepalive_timeout_seconds: keepaliveTimeout } },
        };

        websocketClient['handleWebSocketMessage'](welcommeMessage as any);
        expect(websocketClient.getSessionId()).toBe(connectionId);
        expect(websocketClient['keepAliveIntervalMs']).toBe(keepaliveTimeout * 1000);
        expect(websocketClient['keepAliveInterval']).not.toBeNull();
        expect(websocketClient['sessionId']).toBe(connectionId);
    });
});
