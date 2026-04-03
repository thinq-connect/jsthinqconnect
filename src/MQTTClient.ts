/*
 * SPDX-FileCopyrightText: Copyright 2025 LG Electronics Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import * as _ from "lodash";
import * as forge from "node-forge";
import { io, mqtt, iot } from "aws-iot-device-sdk-v2";

import axios from "axios";
import { ThinQApi } from "./ThinQAPI";

const FILE_ROOT_CA = "AmazonRootCA1.pem";
const ROOT_CA_REPOSITORY = "https://www.amazontrust.com/repository";
const PRIVATE_KEY_SIZE = 2048;
const API_TIMEOUT = 15000;
const CLIENT_BODY = {
    type: "MQTT",
    "service-code": "SVC202",
    "device-type": "607",
    allowExist: true,
};

const ClientConnectionState = {
    CLIENT_CONNECTED: "client_connected",
    CLIENT_DISCONNECTED: "client_disconnected",
};

const isSuccessfulResponse = (response: {
    status: number;
    errorCode?: string | null;
}): boolean => {
    return (
        response.status >= 200 && response.status < 300 && !response.errorCode
    );
};

const isErrorWithMessage = (value: unknown): value is Error => {
    return (
        typeof value === "object" &&
        value !== null &&
        "message" in value &&
        typeof (value as { message?: unknown }).message === "string"
    );
};

type MessageReceivedCallback = (topic: string, payload: ArrayBuffer) => void;
type ConnectionSuccessCallback = (sessionPresent: boolean) => void;
type ConnectionErrorCallback = (error: Error) => void;
type ConnectionClosedCallback = () => void;

export class ThinQMQTTClient {
    private _thinqApi: ThinQApi;
    private _clientId: string;
    private _onMessageReceived: MessageReceivedCallback;
    private _onConnectInterrupted: ConnectionErrorCallback;
    private _onConnectSuccess: ConnectionSuccessCallback;
    private _onConnectFailure: ConnectionErrorCallback;
    private _onConnectClosed: ConnectionClosedCallback;
    private _state: string;
    private _mqttServer: string;
    private _rootCa: string;
    private _privateKey: string;
    private _certificate: string;
    private _csrStr: string;
    private _topicSubscription: string;
    private _mqttConnection: mqtt.MqttClientConnection | undefined;

    constructor(
        thinqApi: ThinQApi,
        clientId: string,
        onMessageReceived: MessageReceivedCallback,
        onConnectInterrupted: ConnectionErrorCallback,
        onConnectSuccess: ConnectionSuccessCallback,
        onConnectFailure: ConnectionErrorCallback,
        onConnectClosed: ConnectionClosedCallback,
    ) {
        this._thinqApi = thinqApi;
        this._clientId = clientId;
        this._onMessageReceived = onMessageReceived;
        this._onConnectInterrupted = onConnectInterrupted;
        this._onConnectSuccess = onConnectSuccess;
        this._onConnectFailure = onConnectFailure;
        this._onConnectClosed = onConnectClosed;
        this._state = ClientConnectionState.CLIENT_DISCONNECTED;
        this._mqttServer = "";
        this._rootCa = "";
        this._privateKey = "";
        this._certificate = "";
        this._csrStr = "";
        this._topicSubscription = "";
        this._mqttConnection = undefined;
    }

    get mqttServer(): string {
        return this._mqttServer;
    }

    set mqttServer(mqttServer: string) {
        this._mqttServer = mqttServer;
    }

    get rootCa(): string {
        return this._rootCa;
    }

    set rootCa(rootCa: string) {
        this._rootCa = rootCa;
    }

    get state(): string {
        return this._state;
    }

    set state(state: string) {
        this._state = state;
    }

    get privateKey(): string {
        return this._privateKey;
    }

    set privateKey(privateKey: string) {
        this._privateKey = privateKey;
    }

    get certificate(): string {
        return this._certificate;
    }

    set certificate(certificate: string) {
        this._certificate = certificate;
    }

    get csrStr(): string {
        return this._csrStr;
    }

    set csrStr(csrStr: string) {
        this._csrStr = csrStr;
    }

    get topicSubscription(): string {
        return this._topicSubscription;
    }

    set topicSubscription(topicSubscription: string) {
        this._topicSubscription = topicSubscription;
    }

    async asyncInit(): Promise<void> {
        const routeResponse = await this._thinqApi.asyncGetRoute(API_TIMEOUT);
        const mqttServerUrl = _.get(routeResponse.body, "mqttServer", "") as
            | string
            | undefined;
        if (!isSuccessfulResponse(routeResponse) || !mqttServerUrl) {
            throw new Error(
                routeResponse.errorMessage || "Failed to resolve MQTT route",
            );
        }
        this.mqttServer = new URL(mqttServerUrl).hostname;
    }

    async asyncPrepareMqtt(): Promise<boolean> {
        const registerResponse = await this._thinqApi.asyncPostClientRegister(
            CLIENT_BODY,
            API_TIMEOUT,
        );
        if (!isSuccessfulResponse(registerResponse)) {
            return false;
        }
        if (!(await this.generateCSR())) {
            return false;
        }
        if (!(await this.issueCertificate())) {
            return false;
        }
        return true;
    }

    async _getRootCertificate(timeout = API_TIMEOUT): Promise<string> {
        const url = `${ROOT_CA_REPOSITORY}/${FILE_ROOT_CA}`;
        return axios
            .get(url, { responseType: "text", timeout: timeout })
            .then((response) => {
                return response.data;
            })
            .catch((error) => {
                console.error(`Failed to download file. Error: ${error}`);
                return "";
            });
    }

    async generateCSR(): Promise<boolean> {
        const certData = await this._getRootCertificate();
        this.rootCa = certData;

        if (!certData) {
            console.error("Root certification download failed");
            return false;
        }

        try {
            const keys = forge.pki.rsa.generateKeyPair(PRIVATE_KEY_SIZE);
            const csr = forge.pki.createCertificationRequest();

            csr.subject.addField({
                name: "commonName",
                value: "lg_thinq",
            });

            csr.publicKey = keys.publicKey;
            csr.sign(keys.privateKey);

            const pem = forge.pki.certificationRequestToPem(csr);
            const privateKeyPem = forge.pki.privateKeyToPem(keys.privateKey);
            this.privateKey = privateKeyPem;
            if (pem) this.csrStr = pem;
            else throw new Error("CSR generation failed");
        } catch (error) {
            console.error("CSR generation failed:", error);
            throw error;
        }
        return true;
    }

    async issueCertificate(): Promise<boolean> {
        if (!this.csrStr) return false;
        const body = {
            "service-code": "SVC202",
            csr: this.csrStr,
        };
        const response = await this._thinqApi.asyncPostClientCertificate(
            body,
            API_TIMEOUT,
        );
        if (!isSuccessfulResponse(response)) return false;

        const certificatePem = _.get(response, "body.result.certificatePem");
        const subscriptions = _.get(response, "body.result.subscriptions");
        if (!certificatePem || !subscriptions) return false;
        this._certificate = certificatePem;
        this._topicSubscription = subscriptions[0];

        return true;
    }

    async connectMqtt(): Promise<mqtt.MqttClientConnection> {
        console.log("Connecting to MQTT server");
        const clientBootstrap = new io.ClientBootstrap();
        const configBuilder =
            iot.AwsIotMqttConnectionConfigBuilder.new_mtls_builder(
                this.certificate,
                this.privateKey,
            );
        configBuilder.with_certificate_authority(this.rootCa);
        configBuilder.with_clean_session(false);
        configBuilder.with_client_id(this._clientId);
        configBuilder.with_endpoint(this._mqttServer);
        configBuilder.with_keep_alive_seconds(6);

        const client = new mqtt.MqttClient(clientBootstrap);
        const connection = client.new_connection(configBuilder.build());
        connection.on("connection_success", (result: unknown) => {
            this._handleConnectionSuccess(result);
        });
        connection.on("connection_failure", (result: unknown) => {
            this._handleConnectionFailure(result);
        });
        connection.on("interrupt", (error: unknown) => {
            this._onConnectInterrupted(error as Error);
        });
        connection.on("message", (topic: string, payload: ArrayBuffer) => {
            this._onMessageReceived(topic, payload);
        });
        connection.on("closed", () => {
            this._onConnectClosed();
        });

        return connection;
    }

    _handleConnectionSuccess(
        result: mqtt.OnConnectionSuccessResult | boolean | unknown,
    ): void {
        if (typeof result === "boolean") {
            this._onConnectSuccess(result);
            return;
        }
        const sessionPresent = _.get(result, "session_present");
        this._onConnectSuccess(
            typeof sessionPresent === "boolean" ? sessionPresent : false,
        );
    }

    _handleConnectionFailure(
        result: mqtt.OnConnectionFailedResult | Error | unknown,
    ): void {
        if (isErrorWithMessage(result)) {
            this._onConnectFailure(result);
            return;
        }
        const error = _.get(result, "error");
        this._onConnectFailure(
            isErrorWithMessage(error)
                ? error
                : new Error(String(error || "MQTT connection failure")),
        );
    }

    async asyncConnectMqtt(): Promise<void> {
        const mqttConnection = await this.connectMqtt();
        console.log(
            `Connecting to endpoint=${this._mqttServer}, client_id: ${this._clientId}`,
        );

        try {
            const connectResult = await mqttConnection.connect();
            console.log(`Connect with session_present: ${connectResult}`);
            await mqttConnection.subscribe(
                this.topicSubscription,
                mqtt.QoS.AtLeastOnce,
            );
            console.log("Complete subscription");
            this._mqttConnection = mqttConnection;
            this._state = ClientConnectionState.CLIENT_CONNECTED;
        } catch (err) {
            console.log(`Failed to connect endpoint: ${err}`);
            this._state = ClientConnectionState.CLIENT_DISCONNECTED;
            return;
        }
    }

    async asyncDisconnectMqtt(): Promise<void> {
        if (this._mqttConnection) {
            try {
                await this._mqttConnection.disconnect();
                this._state = ClientConnectionState.CLIENT_DISCONNECTED;
            } catch (err) {
                console.log(`Failed to disconnect: ${err}`);
            } finally {
                this._mqttConnection = undefined;
            }
        }
    }
}
