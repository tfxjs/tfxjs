import axios, { AxiosRequestConfig } from "axios";
import MakeRequestWithAxios from "../../src/builders/Make.Axios.request";

jest.mock('axios');

jest.mock('../../src/builders/Make.Axios.request', () => {
    const originalModule = jest.requireActual('../../src/builders/Make.Axios.request');
    return {
        __esModule: true, // This line ensures the module is treated as an ES module
        default: originalModule.default
    };
});

describe('MakeRequestWithAxios', () => {
    beforeEach(() => {
        
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should resolve a value', async () => {
        const result = { data: {} };
        jest.spyOn(axios, 'request').mockResolvedValue(result);
        await expect(MakeRequestWithAxios({} as AxiosRequestConfig)).resolves.toEqual(result);
        expect(axios.request).toHaveBeenCalled();
    });

    it('should reject a value', async () => {
        const error = new Error('error');
        jest.spyOn(axios, 'request').mockRejectedValue(error);
        await expect(MakeRequestWithAxios({} as AxiosRequestConfig)).rejects.toEqual(error);
        expect(axios.request).toHaveBeenCalled();
    });
});
