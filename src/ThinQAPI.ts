/*
 * SPDX-FileCopyrightText: Copyright 2025 LG Electronics Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import * as _ from "lodash";
import { v4 as uuidv4 } from "uuid";
import * as base64 from "urlsafe-base64";
import axios, { Axios } from "axios";
import { API_KEY } from "./Const";
import { getRegionFromCountry } from "./CountryPreset";

const Phase: { [key: string]: string } = {
    ST: "ST",
    QA: "QA",
    OP: "OP",
};

export class ThinQApiResponse {
    private _status: number;
    private _messageId: string;
    private _timestamp: string;
    private _errorCode: string | null;
    private _errorMessage: string | null;
    private _body: Record<string, unknown> | null;

    constructor(
        success: boolean,
        status: number,
        payload: Record<string, unknown>,
    ) {
        this._status = status;
        this._messageId = payload["messageId"] as string;
        this._timestamp = payload["timestamp"] as string;
        this._errorMessage = null;
        this._errorCode = null;
        this._body = payload["response"] as Record<string, unknown>;
        if (!success) {
            const error = _.get(payload, "error", {});
            this._errorMessage = _.get(
                error,
                "message",
                "unknown error message",
            );
            this._errorCode = _.get(error, "code", "unknown error code");
        }
    }

    get status(): number {
        return this._status;
    }

    set status(status: number) {
        this._status = status;
    }

    get body(): Record<string, unknown> | null {
        return this._body;
    }

    set body(body: Record<string, unknown> | null) {
        this._body = body;
    }

    get messageId(): string {
        return this._messageId;
    }

    set messageId(messageId: string) {
        this._messageId = messageId;
    }

    get timestamp(): string {
        return this._timestamp;
    }

    set timestamp(timestamp: string) {
        this._timestamp = timestamp;
    }

    get errorCode(): string | null {
        return this._errorCode;
    }

    set errorCode(errorCode: string | null) {
        this._errorCode = errorCode;
    }

    get errorMessage(): string | null {
        return this._errorMessage;
    }

    set errorMessage(errorMessage: string | null) {
        this._errorMessage = errorMessage;
    }

    toString(): string {
        return `ThinQResponse (
            status:${this._status},
            message_id:${this._messageId},
            timestamp:${this._timestamp},
            body:${this._body},
            error:${this.errorCode},${this.errorMessage})`;
    }
}

export class ThinQApi {
    private _accessToken: string;
    private _countryCode: string;
    private _clientId: string;
    private _apiKey: string;
    private _phase: string;
    private _regionCode: string | undefined;

    constructor(accessToken: string, countryCode: string, clientId: string) {
        this._accessToken = accessToken;
        this._countryCode = countryCode;
        this._clientId = clientId;
        this._apiKey = API_KEY;
        this._phase = Phase.OP;
        this._regionCode = getRegionFromCountry(countryCode);
    }

    _getUrlFromEndpoint(endpoint: string): string {
        if (this._phase === Phase.ST)
            return `https://api-${_.toLower(
                this._regionCode,
            )}-st.lgthinq.com/${endpoint}`;
        else if (this._phase === Phase.QA)
            return `https://api-${_.toLower(
                this._regionCode,
            )}-qa.lgthinq.com/${endpoint}`;
        else
            return `https://api-${_.toLower(
                this._regionCode,
            )}.lgthinq.com/${endpoint}`;
    }

    _generateMessageId(): string {
        const uuidBytes = Buffer.from(uuidv4().replace(/-/g, ""), "hex");
        const base64Encoded = base64.encode(uuidBytes);
        return base64Encoded;
    }

    _generateHeaders(headers: Record<string, string>): Record<string, string> {
        return {
            Authorization: `Bearer ${this._accessToken}`,
            "x-country": this._countryCode,
            "x-message-id": this._generateMessageId(),
            "x-client-id": this._clientId,
            "x-api-key": this._apiKey,
            "x-service-phase": this._phase,
            ...headers,
        };
    }

    async _asyncRequest(
        method: string,
        endpoint: string,
        timeout = 15000,
        headers?: Record<string, string>,
        payload?: Record<string, unknown>,
    ): Promise<ThinQApiResponse> {
        headers = headers || {};
        payload = payload || {};
        const generatedHeaders = this._generateHeaders(headers);
        const endpoint_url = this._getUrlFromEndpoint(endpoint);
        console.log(`method: ${method}`);
        console.log(`endpoint: ${endpoint_url}`);
        console.log(`header: ${JSON.stringify(generatedHeaders, null, 2)}`);
        console.log(`payload: ${JSON.stringify(payload, null, 2)}`);
        const client: Axios = axios.create({
            headers: generatedHeaders,
        });
        try {
            let response;
            const config = { timeout: timeout };
            if (method.toLowerCase() === "get") {
                response = await client.get(endpoint_url, config);
            } else if (method.toLowerCase() === "post") {
                response = await client.post(endpoint_url, payload, config);
            } else if (method.toLowerCase() === "put") {
                response = await client.put(endpoint_url, payload, config);
            } else if (method.toLowerCase() === "delete") {
                response = await client.delete(endpoint_url, config);
            } else {
                throw new Error(`Unsupported method: ${method}`);
            }
            return new ThinQApiResponse(true, response.status, response.data);
        } catch (error: unknown) {
            console.log(`Error: ${error}`);
            if (axios.isAxiosError(error)) {
                const status = error.response?.status ?? 500;
                const data = error.response?.data ?? {
                    error: {
                        message: "Unexpected Error",
                        code: "Unknown Error Code",
                    },
                };
                return new ThinQApiResponse(false, status, data);
            }
            return new ThinQApiResponse(false, 500, {
                error: {
                    message:
                        error instanceof Error
                            ? error.message
                            : "Unknown Error",
                    code: "Unknown Error Code",
                },
            });
        }
    }

    async asyncGetDeviceList(timeout = 15000): Promise<ThinQApiResponse> {
        return this._asyncRequest("GET", "devices", timeout);
    }

    async asyncGetDeviceProfile(
        deviceId: string,
        timeout = 15000,
    ): Promise<ThinQApiResponse> {
        return this._asyncRequest(
            "GET",
            `devices/${deviceId}/profile`,
            timeout,
        );
    }

    async asyncGetDeviceStatus(
        deviceId: string,
        timeout = 15000,
    ): Promise<ThinQApiResponse> {
        return this._asyncRequest("GET", `devices/${deviceId}/state`, timeout);
    }

    async asyncPostDeviceControl(
        deviceId: string,
        payload: Record<string, unknown>,
        timeout = 15000,
    ): Promise<ThinQApiResponse> {
        const headers = { "x-conditional-control": "true" };
        return await this._asyncRequest(
            "POST",
            `devices/${deviceId}/control`,
            timeout,
            headers,
            payload,
        );
    }

    async asyncPostClientRegister(
        payload: Record<string, unknown>,
        timeout = 15000,
    ): Promise<ThinQApiResponse> {
        return this._asyncRequest("POST", "client", timeout, {}, payload);
    }

    async asyncDeleteClientRegister(
        payload: Record<string, unknown>,
        timeout = 15000,
    ): Promise<ThinQApiResponse> {
        return this._asyncRequest("DELETE", "client", timeout, {}, payload);
    }

    async asyncPostClientCertificate(
        payload: Record<string, unknown>,
        timeout = 15000,
    ): Promise<ThinQApiResponse> {
        return this._asyncRequest(
            "POST",
            "client/certificate",
            timeout,
            {},
            payload,
        );
    }

    async asyncGetPushList(timeout = 15000): Promise<ThinQApiResponse> {
        return this._asyncRequest("GET", "push", timeout);
    }

    async asyncPostPushSubscribe(
        deviceId: string,
        timeout = 15000,
    ): Promise<ThinQApiResponse> {
        return this._asyncRequest(
            "POST",
            `push/${deviceId}/subscribe`,
            timeout,
        );
    }

    async asyncDeletePushSubscribe(
        deviceId: string,
        timeout = 15000,
    ): Promise<ThinQApiResponse> {
        return this._asyncRequest(
            "DELETE",
            `push/${deviceId}/unsubscribe`,
            timeout,
        );
    }

    async asyncGetEventList(timeout = 15000): Promise<ThinQApiResponse> {
        return this._asyncRequest("GET", "event", timeout);
    }

    async asyncPostEventSubscribe(
        deviceId: string,
        timeout = 15000,
    ): Promise<ThinQApiResponse> {
        const payload = { expire: { unit: "HOUR", timer: 4464 } };
        return this._asyncRequest(
            "POST",
            `event/${deviceId}/subscribe`,
            timeout,
            {},
            payload,
        );
    }

    async asyncDeleteEventSubscribe(
        deviceId: string,
        timeout = 15000,
    ): Promise<ThinQApiResponse> {
        return this._asyncRequest(
            "DELETE",
            `event/${deviceId}/unsubscribe`,
            timeout,
        );
    }

    async asyncGetPushDevicesList(timeout = 15000): Promise<ThinQApiResponse> {
        return this._asyncRequest("GET", "push/devices", timeout);
    }

    async asyncPostPushDevicesSubscribe(
        timeout = 15000,
    ): Promise<ThinQApiResponse> {
        return this._asyncRequest("POST", "push/devices", timeout);
    }

    async asyncDeletePushDevicesSubscribe(
        timeout = 15000,
    ): Promise<ThinQApiResponse> {
        return this._asyncRequest("DELETE", "push/devices", timeout);
    }

    async asyncGetRoute(timeout = 15000): Promise<ThinQApiResponse> {
        return this._asyncRequest("GET", "route", timeout);
    }

    async asyncGetDeviceEnergyProfile(
        deviceId: string,
        timeout = 15000,
    ): Promise<ThinQApiResponse> {
        return this._asyncRequest(
            "GET",
            `devices/energy/${deviceId}/profile`,
            timeout,
        );
    }

    async asyncGetDeviceEnergyUsage(
        deviceId: string,
        energyProperty: string,
        period: string,
        startDate: string,
        endDate: string,
        timeout = 15000,
    ): Promise<ThinQApiResponse> {
        return this._asyncRequest(
            "GET",
            `devices/energy/${deviceId}/usage?property=${energyProperty}&period=${period}&startDate=${startDate}&endDate=${endDate}`,
            timeout,
        );
    }
}
