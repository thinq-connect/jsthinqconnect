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
import { ThinQApi } from "../ThinQAPI";

export class WaterPurifierProfile extends ConnectDeviceProfile {
    static _RESOURCE_MAP: ResourceMap = {
        runState: "runState",
        waterInfo: "waterInfo",
    };
    static _PROFILE: ProfileMap = {
        runState: {
            cockState: "cockState",
            sterilizingState: "sterilizingState",
        },
        waterInfo: { waterType: "waterType" },
    };
    static _CUSTOM_PROPERTIES: CustomProperties = [];
    static _LOCATION_MAP: LocationMap = {};

    constructor(profile: Record<string, any>) {
        super(
            profile,
            WaterPurifierProfile._RESOURCE_MAP,
            WaterPurifierProfile._PROFILE,
            WaterPurifierProfile._LOCATION_MAP,
            WaterPurifierProfile._CUSTOM_PROPERTIES,
        );
    }
}

export const WATER_PURIFIER_RESOURCE_MAP: ResourceMap =
    WaterPurifierProfile._RESOURCE_MAP;
export const WATER_PURIFIER_PROFILE_MAP: ProfileMap =
    WaterPurifierProfile._PROFILE;
export const WATER_PURIFIER_CUSTOM_PROPERTIES: CustomProperties =
    WaterPurifierProfile._CUSTOM_PROPERTIES;
export const WATER_PURIFIER_LOCATION_MAP: LocationMap =
    WaterPurifierProfile._LOCATION_MAP;
export const WATER_PURIFIER_PROFILE_DEFINITION: ConnectDeviceProfileDefinition =
    {
        resourceMap: WATER_PURIFIER_RESOURCE_MAP,
        profileMap: WATER_PURIFIER_PROFILE_MAP,
        locationMap: WATER_PURIFIER_LOCATION_MAP,
        customProperties: WATER_PURIFIER_CUSTOM_PROPERTIES,
    };
export const createWaterPurifierProfile = (
    profile: Record<string, DynamicObjectOrStringArray>,
): ConnectDeviceProfile =>
    createConnectDeviceProfile(profile, WATER_PURIFIER_PROFILE_DEFINITION);

export class WaterPurifierDevice extends ConnectBaseDevice {
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
            createWaterPurifierProfile(profile),
            undefined,
            undefined,
            energyProfile,
        );
    }

    get profiles(): ConnectDeviceProfile {
        return this._profiles;
    }
}
