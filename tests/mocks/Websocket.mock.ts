export class MockWebSocket {
    public on = jest.fn();
    public send = jest.fn();
    public close = jest.fn();
    public readyState = MockWebSocket.OPEN;

    static OPEN = 1;
    static CLOSED = 3;

    constructor(url: string) {
        setTimeout(() => {
            this.on.mock.calls.forEach(([event, handler]) => {
                if (event === 'open') {
                    handler();
                }
            });
        }, 0);
    }
}