/*
 * SPDX-FileCopyrightText: Copyright 2025 LG Electronics Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import _ from "lodash";
import { ConnectBaseDevice, ConnectDeviceProfile } from "./ConnectDevice";
import {
    ResourceMap,
    ProfileMap,
    CustomProperties,
    LocationMap,
} from "../types/Resources";
import { ThinQApi, ThinQApiResponse } from "../ThinQAPI";

export class DehumidifierProfile extends ConnectDeviceProfile {
    static _RESOURCE_MAP: ResourceMap = {
        operation: "operation",
        dehumidifierJobMode: "dehumidifierJobMode",
        humidity: "humidity",
        airFlow: "airFlow",
    };
    static _PROFILE: ProfileMap = {
        operation: { dehumidifierOperationMode: "dehumidifierOperationMode" },
        dehumidifierJobMode: { currentJobMode: "currentJobMode" },
        humidity: {
            currentHumidity: "currentHumidity",
            targetHumidity: "targetHumidity",
        },
        airFlow: { windStrength: "windStrength" },
    };
    static _CUSTOM_PROPERTIES: CustomProperties = [];
    static _LOCATION_MAP: LocationMap = {};

    constructor(profile: Record<string, any>) {
        super(
            profile,
            DehumidifierProfile._RESOURCE_MAP,
            DehumidifierProfile._PROFILE,
            DehumidifierProfile._LOCATION_MAP,
            DehumidifierProfile._CUSTOM_PROPERTIES,
        );
    }
}

export class DehumidifierDevice extends ConnectBaseDevice {
    constructor(
        thinqApi: ThinQApi,
        deviceId: string,
        deviceType: string,
        modelName: string,
        alias: string,
        reportable: boolean,
        profile: Record<string, any>,
        energyProfile?: Record<string, unknown>,
    ) {
        super(
            thinqApi,
            deviceId,
            deviceType,
            modelName,
            alias,
            reportable,
            new DehumidifierProfile(profile),
            undefined,
            undefined,
            energyProfile,
        );
    }

    get profiles(): ConnectDeviceProfile {
        return this._profiles;
    }

    setDehumidifierOperationMode = async (
        mode: string,
    ): Promise<ThinQApiResponse | undefined> => {
        return await this.doEnumAttributeCommand(
            "dehumidifierOperationMode",
            mode,
        );
    };

    setTargetHumidity = async (
        humidity: number,
    ): Promise<ThinQApiResponse | undefined> => {
        return await this.doAttributeCommand("targetHumidity", humidity);
    };

    setCurrentJobMode = async (
        mode: string,
    ): Promise<ThinQApiResponse | undefined> => {
        return await this.doEnumAttributeCommand("currentJobMode", mode);
    };

    setWindStrength = async (
        strength: string,
    ): Promise<ThinQApiResponse | undefined> => {
        return await this.doEnumAttributeCommand("windStrength", strength);
    };
}
