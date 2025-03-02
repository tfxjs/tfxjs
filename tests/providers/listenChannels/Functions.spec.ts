import { Container } from '@inversifyjs/container';
import ListenChannelsProvider, { GetListenerChannelsRefreshFunction } from '../../../src/providers/ListenChannels.provider';
import DINames from '../../../src/utils/DI.names';

describe('ListenChannelsProvider: Functions', () => {
    beforeEach(() => {
        jest.spyOn(Container.prototype, 'isBound').mockReturnValue(true);
        jest.spyOn(Container.prototype, 'get').mockImplementation((id: any) => {
            if (id === DINames.ListenChannelsProvider) return ListenChannelsProvider.prototype;
            return null;
        });

    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Function: GetListenerChannelsRefreshFunction', () => {
        it('should return function for refreshing channels', () => {
            jest.spyOn(ListenChannelsProvider.prototype, 'refreshChannels').mockImplementation(jest.fn());
            const refreshFunction = GetListenerChannelsRefreshFunction();
            expect(typeof refreshFunction).toBe('function');
            refreshFunction();
            expect(ListenChannelsProvider.prototype.refreshChannels).toHaveBeenCalled();
        });
    });
});