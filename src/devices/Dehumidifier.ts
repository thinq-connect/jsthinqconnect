/*
 * SPDX-FileCopyrightText: Copyright 2025 LG Electronics Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {
    ConnectBaseDevice,
    ConnectDeviceProfile,
    ConnectDeviceProfileDefinition,
    createConnectDeviceProfile,
} from "./ConnectDevice";
import {
    ResourceMap,
    ProfileMap,
    CustomProperties,
    LocationMap,
} from "../types/Resources";
import { DynamicObjectOrStringArray } from "../types/Devices";
import { ThinQApi, ThinQApiResponse } from "../ThinQAPI";

export const DEHUMIDIFIER_RESOURCE_MAP: ResourceMap = {
    operation: "operation",
    dehumidifierJobMode: "dehumidifierJobMode",
    humidity: "humidity",
    airFlow: "airFlow",
};

export const DEHUMIDIFIER_PROFILE_MAP: ProfileMap = {
    operation: { dehumidifierOperationMode: "dehumidifierOperationMode" },
    dehumidifierJobMode: { currentJobMode: "currentJobMode" },
    humidity: {
        currentHumidity: "currentHumidity",
        targetHumidity: "targetHumidity",
    },
    airFlow: { windStrengthLevel: "windStrength" },
};

export const DEHUMIDIFIER_CUSTOM_PROPERTIES: CustomProperties = [];
export const DEHUMIDIFIER_LOCATION_MAP: LocationMap = {};

export const DEHUMIDIFIER_PROFILE_DEFINITION: ConnectDeviceProfileDefinition = {
    resourceMap: DEHUMIDIFIER_RESOURCE_MAP,
    profileMap: DEHUMIDIFIER_PROFILE_MAP,
    locationMap: DEHUMIDIFIER_LOCATION_MAP,
    customProperties: DEHUMIDIFIER_CUSTOM_PROPERTIES,
};

export const createDehumidifierProfile = (
    profile: Record<string, DynamicObjectOrStringArray>,
): ConnectDeviceProfile => {
    return createConnectDeviceProfile(profile, DEHUMIDIFIER_PROFILE_DEFINITION);
};

export class DehumidifierProfile extends ConnectDeviceProfile {
    static _RESOURCE_MAP: ResourceMap = DEHUMIDIFIER_RESOURCE_MAP;
    static _PROFILE: ProfileMap = DEHUMIDIFIER_PROFILE_MAP;
    static _CUSTOM_PROPERTIES: CustomProperties =
        DEHUMIDIFIER_CUSTOM_PROPERTIES;
    static _LOCATION_MAP: LocationMap = DEHUMIDIFIER_LOCATION_MAP;

    constructor(profile: Record<string, DynamicObjectOrStringArray>) {
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
        profile: Record<string, DynamicObjectOrStringArray>,
        energyProfile?: Record<string, unknown>,
    ) {
        super(
            thinqApi,
            deviceId,
            deviceType,
            modelName,
            alias,
            reportable,
            createDehumidifierProfile(profile),
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
