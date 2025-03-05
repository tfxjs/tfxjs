import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

export default async function MakeRequestWithAxios<T>(requestConfig: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return await axios.request<T>(requestConfig)
}