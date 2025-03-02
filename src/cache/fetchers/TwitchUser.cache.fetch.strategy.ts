import Container, { Inject, Service } from "typedi";
import { FetchStrategy } from "../../types/Cache.types";
import DINames from "../../utils/DI.names";
import APIClient from "../../clients/Api.client";

@Service(DINames.TwitchUserCacheFetchStrategy)
export default class TwitchUserCacheFetchStrategy implements FetchStrategy<any> {
    private readonly apiClient: APIClient;
    constructor() {
        this.apiClient = Container.get<APIClient>(DINames.APIClient);
    }

    fetch(id: string): Promise<any | null> {
        return this.apiClient.getUserById(id);
    }
}