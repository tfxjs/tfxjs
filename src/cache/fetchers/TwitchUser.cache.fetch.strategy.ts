import { FetchStrategy } from "../../types/Cache.types";
import DINames from "../../utils/DI.names";
import APIClient from "../../clients/Api.client";
import { DIContainer } from "../../di/Container";

export default class TwitchUserCacheFetchStrategy implements FetchStrategy<any> {
    private readonly apiClient: APIClient;
    constructor() {
        this.apiClient = DIContainer.get<APIClient>(DINames.APIClient);
    }

    fetch(id: string): Promise<any | null> {
        return this.apiClient.getUserById(id);
    }
}