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

export class DishWasherProfile extends ConnectDeviceProfile {
    static _RESOURCE_MAP: ResourceMap = {
        runState: "runState",
        dishWashingStatus: "dishWashingStatus",
        preference: "preference",
        doorStatus: "doorStatus",
        operation: "operation",
        remoteControlEnable: "remoteControlEnable",
        timer: "timer",
        dishWashingCourse: "dishWashingCourse",
    };
    static _PROFILE: ProfileMap = {
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
    static _CUSTOM_PROPERTIES: CustomProperties = [];
    static _LOCATION_MAP: LocationMap = {};

    constructor(profile: Record<string, any>) {
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
            new DishWasherProfile(profile),
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
