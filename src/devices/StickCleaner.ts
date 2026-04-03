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

export class StickCleanerProfile extends ConnectDeviceProfile {
    static _RESOURCE_MAP: ResourceMap = {
        runState: "runState",
        stickCleanerJobMode: "stickCleanerJobMode",
        battery: "battery",
    };
    static _PROFILE: ProfileMap = {
        runState: { currentState: "currentState" },
        stickCleanerJobMode: { currentJobMode: "currentJobMode" },
        battery: { level: "batteryLevel", percent: "batteryPercent" },
    };
    static _CUSTOM_PROPERTIES: CustomProperties = [];
    static _LOCATION_MAP: LocationMap = {};

    constructor(profile: Record<string, any>) {
        super(
            profile,
            StickCleanerProfile._RESOURCE_MAP,
            StickCleanerProfile._PROFILE,
            StickCleanerProfile._LOCATION_MAP,
            StickCleanerProfile._CUSTOM_PROPERTIES,
        );
    }
}

export const STICK_CLEANER_RESOURCE_MAP: ResourceMap =
    StickCleanerProfile._RESOURCE_MAP;
export const STICK_CLEANER_PROFILE_MAP: ProfileMap =
    StickCleanerProfile._PROFILE;
export const STICK_CLEANER_CUSTOM_PROPERTIES: CustomProperties =
    StickCleanerProfile._CUSTOM_PROPERTIES;
export const STICK_CLEANER_LOCATION_MAP: LocationMap =
    StickCleanerProfile._LOCATION_MAP;
export const STICK_CLEANER_PROFILE_DEFINITION: ConnectDeviceProfileDefinition =
    {
        resourceMap: STICK_CLEANER_RESOURCE_MAP,
        profileMap: STICK_CLEANER_PROFILE_MAP,
        locationMap: STICK_CLEANER_LOCATION_MAP,
        customProperties: STICK_CLEANER_CUSTOM_PROPERTIES,
    };
export const createStickCleanerProfile = (
    profile: Record<string, DynamicObjectOrStringArray>,
): ConnectDeviceProfile =>
    createConnectDeviceProfile(profile, STICK_CLEANER_PROFILE_DEFINITION);

export class StickCleanerDevice extends ConnectBaseDevice {
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
            createStickCleanerProfile(profile),
            undefined,
            undefined,
            energyProfile,
        );
    }

    get profiles(): ConnectDeviceProfile {
        return this._profiles;
    }
}
