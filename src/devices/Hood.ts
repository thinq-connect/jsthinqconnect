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

export const HOOD_RESOURCE_MAP: ResourceMap = {
    ventilation: "ventilation",
    lamp: "lamp",
    operation: "operation",
};

export const HOOD_PROFILE_MAP: ProfileMap = {
    ventilation: { fanSpeed: "fanSpeed" },
    lamp: { lampBrightness: "lampBrightness" },
    operation: { hoodOperationMode: "hoodOperationMode" },
};

export const HOOD_CUSTOM_PROPERTIES: CustomProperties = [];
export const HOOD_LOCATION_MAP: LocationMap = {};

export const HOOD_PROFILE_DEFINITION: ConnectDeviceProfileDefinition = {
    resourceMap: HOOD_RESOURCE_MAP,
    profileMap: HOOD_PROFILE_MAP,
    locationMap: HOOD_LOCATION_MAP,
    customProperties: HOOD_CUSTOM_PROPERTIES,
};

export const createHoodProfile = (
    profile: Record<string, DynamicObjectOrStringArray>,
): ConnectDeviceProfile => {
    return createConnectDeviceProfile(profile, HOOD_PROFILE_DEFINITION);
};

export class HoodProfile extends ConnectDeviceProfile {
    static _RESOURCE_MAP: ResourceMap = HOOD_RESOURCE_MAP;
    static _PROFILE: ProfileMap = HOOD_PROFILE_MAP;
    static _CUSTOM_PROPERTIES: CustomProperties = HOOD_CUSTOM_PROPERTIES;
    static _LOCATION_MAP: LocationMap = HOOD_LOCATION_MAP;

    constructor(profile: Record<string, DynamicObjectOrStringArray>) {
        super(
            profile,
            HoodProfile._RESOURCE_MAP,
            HoodProfile._PROFILE,
            HoodProfile._LOCATION_MAP,
            HoodProfile._CUSTOM_PROPERTIES,
        );
    }
}

export class HoodDevice extends ConnectBaseDevice {
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
            createHoodProfile(profile),
            undefined,
            undefined,
            energyProfile,
        );
    }

    get profiles(): ConnectDeviceProfile {
        return this._profiles;
    }

    setFanSpeedLampBrightness = async (
        fanSpeed: number,
        lampBrightness: number,
    ): Promise<ThinQApiResponse> => {
        return await this.doMultiRangeAttributeCommand({
            fanSpeed: fanSpeed,
            lampBrightness: lampBrightness,
        });
    };

    setFanSpeed = async (fanSpeed: number): Promise<ThinQApiResponse> => {
        return await this.doMultiRangeAttributeCommand({
            fanSpeed: fanSpeed,
            lampBrightness: this.lampBrightness,
        });
    };

    setLampBrightness = async (
        lampBrightness: number,
    ): Promise<ThinQApiResponse> => {
        return await this.doMultiRangeAttributeCommand({
            fanSpeed: this.fanSpeed,
            lampBrightness: lampBrightness,
        });
    };
}
