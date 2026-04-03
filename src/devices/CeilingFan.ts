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

export const CEILING_FAN_RESOURCE_MAP: ResourceMap = {
    airFlow: "airFlow",
    operation: "operation",
};

export const CEILING_FAN_PROFILE_MAP: ProfileMap = {
    airFlow: { windStrength: "windStrength" },
    operation: { ceilingfanOperationMode: "ceilingfanOperationMode" },
};

export const CEILING_FAN_CUSTOM_PROPERTIES: CustomProperties = [];
export const CEILING_FAN_LOCATION_MAP: LocationMap = {};

export const CEILING_FAN_PROFILE_DEFINITION: ConnectDeviceProfileDefinition = {
    resourceMap: CEILING_FAN_RESOURCE_MAP,
    profileMap: CEILING_FAN_PROFILE_MAP,
    locationMap: CEILING_FAN_LOCATION_MAP,
    customProperties: CEILING_FAN_CUSTOM_PROPERTIES,
};

export const createCeilingFanProfile = (
    profile: Record<string, DynamicObjectOrStringArray>,
): ConnectDeviceProfile => {
    return createConnectDeviceProfile(profile, CEILING_FAN_PROFILE_DEFINITION);
};

export class CeilingFanProfile extends ConnectDeviceProfile {
    static _RESOURCE_MAP: ResourceMap = CEILING_FAN_RESOURCE_MAP;
    static _PROFILE: ProfileMap = CEILING_FAN_PROFILE_MAP;
    static _CUSTOM_PROPERTIES: CustomProperties = CEILING_FAN_CUSTOM_PROPERTIES;
    static _LOCATION_MAP: LocationMap = CEILING_FAN_LOCATION_MAP;

    constructor(profile: Record<string, DynamicObjectOrStringArray>) {
        super(
            profile,
            CeilingFanProfile._RESOURCE_MAP,
            CeilingFanProfile._PROFILE,
            CeilingFanProfile._LOCATION_MAP,
            CeilingFanProfile._CUSTOM_PROPERTIES,
        );
    }
}

export class CeilingFanDevice extends ConnectBaseDevice {
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
            createCeilingFanProfile(profile),
            undefined,
            undefined,
            energyProfile,
        );
    }

    get profiles(): ConnectDeviceProfile {
        return this._profiles;
    }

    setCeilingfanOperationMode = async (
        mode: string,
    ): Promise<ThinQApiResponse | undefined> => {
        return await this.doEnumAttributeCommand(
            "ceilingfanOperationMode",
            mode,
        );
    };

    setWindStrength = async (
        strength: string,
    ): Promise<ThinQApiResponse | undefined> => {
        return await this.doEnumAttributeCommand("windStrength", strength);
    };
}
