/*
 * SPDX-FileCopyrightText: Copyright 2025 LG Electronics Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import { ThinQApi } from "./ThinQAPI";

export class BaseDevice {
    private _thinqApi: ThinQApi;
    private _deviceId: string;
    private _deviceType: string;
    private _modelName: string;
    private _alias: string;
    private _reportable: boolean;

    constructor(
        thinqApi: ThinQApi,
        deviceId: string,
        deviceType: string,
        modelName: string,
        alias: string,
        reportable: boolean,
    ) {
        this._thinqApi = thinqApi;
        this._deviceId = deviceId;
        this._deviceType = deviceType;
        this._modelName = modelName;
        this._alias = alias;
        this._reportable = reportable;
    }

    get thinqApi(): ThinQApi {
        return this._thinqApi;
    }

    get deviceType(): string {
        return this._deviceType;
    }

    set deviceType(deviceType: string) {
        this._deviceType = deviceType;
    }

    get modelName(): string {
        return this._modelName;
    }

    set modelName(modelName: string) {
        this._modelName = modelName;
    }

    get alias(): string {
        return this._alias;
    }

    set alias(alias) {
        this._alias = alias;
    }

    get reportable(): boolean {
        return this._reportable;
    }

    set reportable(reportable: boolean) {
        this._reportable = reportable;
    }

    get deviceId(): string {
        return this._deviceId;
    }

    set deviceId(deviceId: string) {
        this._deviceId = deviceId;
    }
}
