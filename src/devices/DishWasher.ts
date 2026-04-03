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

export const DISH_WASHER_RESOURCE_MAP: ResourceMap = {
    runState: "runState",
    dishWashingStatus: "dishWashingStatus",
    preference: "preference",
    doorStatus: "doorStatus",
    operation: "operation",
    remoteControlEnable: "remoteControlEnable",
    timer: "timer",
    dishWashingCourse: "dishWashingCourse",
};

export const DISH_WASHER_PROFILE_MAP: ProfileMap = {
    runState: { currentState: "currentState" },
    dishWashingStatus: { rinseRefill: "rinseRefill" },
    preference: {
        rinseLevel: "rinseLevel",
        softeningLevel: "softeningLevel",
        mCReminder: "machineCleanReminder",
        signalLevel: "signalLevel",
        cleanLReminder: "cleanLightReminder",
    },
    doorStatus: { doorState: "doorState" },
    operation: { dishWasherOperationMode: "dishWasherOperationMode" },
    remoteControlEnable: { remoteControlEnabled: "remoteControlEnabled" },
    timer: {
        relativeHourToStart: "relativeHourToStart",
        relativeMinuteToStart: "relativeMinuteToStart",
        remainHour: "remainHour",
        remainMinute: "remainMinute",
        totalHour: "totalHour",
        totalMinute: "totalMinute",
    },
    dishWashingCourse: {
        currentDishWashingCourse: "currentDishWashingCourse",
    },
};

export const DISH_WASHER_CUSTOM_PROPERTIES: CustomProperties = [];
export const DISH_WASHER_LOCATION_MAP: LocationMap = {};

export const DISH_WASHER_PROFILE_DEFINITION: ConnectDeviceProfileDefinition = {
    resourceMap: DISH_WASHER_RESOURCE_MAP,
    profileMap: DISH_WASHER_PROFILE_MAP,
    locationMap: DISH_WASHER_LOCATION_MAP,
    customProperties: DISH_WASHER_CUSTOM_PROPERTIES,
};

export const createDishWasherProfile = (
    profile: Record<string, DynamicObjectOrStringArray>,
): ConnectDeviceProfile => {
    return createConnectDeviceProfile(profile, DISH_WASHER_PROFILE_DEFINITION);
};

export class DishWasherProfile extends ConnectDeviceProfile {
    static _RESOURCE_MAP: ResourceMap = DISH_WASHER_RESOURCE_MAP;
    static _PROFILE: ProfileMap = DISH_WASHER_PROFILE_MAP;
    static _CUSTOM_PROPERTIES: CustomProperties = DISH_WASHER_CUSTOM_PROPERTIES;
    static _LOCATION_MAP: LocationMap = DISH_WASHER_LOCATION_MAP;

    constructor(profile: Record<string, DynamicObjectOrStringArray>) {
        super(
            profile,
            DishWasherProfile._RESOURCE_MAP,
            DishWasherProfile._PROFILE,
            DishWasherProfile._LOCATION_MAP,
            DishWasherProfile._CUSTOM_PROPERTIES,
        );
    }
}

export class DishWasherDevice extends ConnectBaseDevice {
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
            createDishWasherProfile(profile),
            undefined,
            undefined,
            energyProfile,
        );
    }

    get profiles(): ConnectDeviceProfile {
        return this._profiles;
    }

    setDishWasherOperationMode = async (
        mode: string,
    ): Promise<ThinQApiResponse | undefined> => {
        return await this.doEnumAttributeCommand(
            "dishWasherOperationMode",
            mode,
        );
    };

    setRelativeHourToStart = async (
        hour: number,
    ): Promise<ThinQApiResponse | undefined> => {
        return await this.doAttributeCommand("relativeHourToStart", hour);
    };
}
