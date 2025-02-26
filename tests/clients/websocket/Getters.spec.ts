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

describe('WebsocketClient: Getters', () => {
    let websocketClient: WebsocketClient;

    beforeEach(() => {
        websocketClient = new WebsocketClient();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });
    
    it('should return session ID', () => {
        websocketClient['sessionId'] = 'test-session-id';
        expect(websocketClient.getSessionId()).toBe('test-session-id');
    });

});
