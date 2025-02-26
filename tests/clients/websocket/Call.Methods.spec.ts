import { loggerMock } from '../../mocks/Logger.mock';
import { MockWebSocket } from '../../mocks/Websocket.mock';

jest.mock('ws', () => ({
    WebSocket: MockWebSocket,
}));

jest.mock('../../../src/utils/Logger', () => ({
    LoggerFactory: {
        createLogger: jest.fn(() => loggerMock),
    },
}));

import WebsocketClient from '../../../src/clients/Websocket.client';
import { WebsocketMessageType } from '../../../src/types/Websocket.types';

describe('WebsocketClient: Call methods', () => {
    let websocketClient: WebsocketClient;

    beforeEach(() => {
        websocketClient = new WebsocketClient();
    });

    afterEach(() => {
        jest.clearAllMocks();
        if (websocketClient['keepAliveInterval']) {
            clearInterval(websocketClient['keepAliveInterval']);
        }
    });

    it('should call handleWelcomeMessage method', () => {
        jest.spyOn(websocketClient as any, 'handleWelcomeMessage').mockImplementation(jest.fn());
        const welcomeMessage = { metadata: { message_type: WebsocketMessageType.Welcome } };
        websocketClient['handleWebSocketMessage'](welcomeMessage as any);
        expect(websocketClient['handleWelcomeMessage']).toHaveBeenCalled();
    });

    it('should call handleNotification method', () => {
        jest.spyOn(websocketClient as any, 'handleNotification').mockImplementation(jest.fn());

        const notificationMessage = { metadata: { message_type: WebsocketMessageType.Notification } };

        websocketClient['handleWebSocketMessage'](notificationMessage as any);
        expect(websocketClient['handleNotification']).toHaveBeenCalled();
    });

    it('should call handleRevocation method', () => {
        jest.spyOn(websocketClient as any, 'handleRevocation').mockImplementation(jest.fn());
        const revocationMessage = {
            metadata: { message_type: WebsocketMessageType.Revocation },
            payload: { subscription: { type: 'type', id: 'sub-id' } },
        };
        websocketClient['handleWebSocketMessage'](revocationMessage as any);
        expect(websocketClient['handleRevocation']).toHaveBeenCalled();
    });

    it('should call handleClose method', () => {
        jest.spyOn(websocketClient as any, 'handleClose').mockImplementation(jest.fn());
        const closeMessage = { metadata: { message_type: WebsocketMessageType.Close } };
        websocketClient['handleWebSocketMessage'](closeMessage as any);
        expect(websocketClient['handleClose']).toHaveBeenCalled();
    });

    it('should call handleHeepAlive method', () => {
        jest.spyOn(websocketClient as any, 'handleKeepAlive').mockImplementation(jest.fn());
        const keepAliveMessage = { metadata: { message_type: WebsocketMessageType.KeepAlive } };
        websocketClient['handleWebSocketMessage'](keepAliveMessage as any);
        expect(websocketClient['handleKeepAlive']).toHaveBeenCalled();
    });
});
