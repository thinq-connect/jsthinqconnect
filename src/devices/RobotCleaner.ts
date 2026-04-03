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

export class RobotCleanerProfile extends ConnectDeviceProfile {
    static _RESOURCE_MAP: ResourceMap = {
        runState: "runState",
        robotCleanerJobMode: "robotCleanerJobMode",
        operation: "operation",
        battery: "battery",
        timer: "timer",
    };
    static _PROFILE: ProfileMap = {
        runState: { currentState: "currentState" },
        robotCleanerJobMode: { currentJobMode: "currentJobMode" },
        operation: { cleanOperationMode: "cleanOperationMode" },
        battery: { level: "batteryLevel", percent: "batteryPercent" },
        timer: {
            absoluteHourToStart: "absoluteHourToStart",
            absoluteMinuteToStart: "absoluteMinuteToStart",
            runningHour: "runningHour",
            runningMinute: "runningMinute",
        },
    };
    static _CUSTOM_PROPERTIES: CustomProperties = [];
    static _LOCATION_MAP: LocationMap = {};

    constructor(profile: Record<string, any>) {
        super(
            profile,
            RobotCleanerProfile._RESOURCE_MAP,
            RobotCleanerProfile._PROFILE,
            RobotCleanerProfile._LOCATION_MAP,
            RobotCleanerProfile._CUSTOM_PROPERTIES,
        );
    }
}

export const ROBOT_CLEANER_RESOURCE_MAP: ResourceMap =
    RobotCleanerProfile._RESOURCE_MAP;
export const ROBOT_CLEANER_PROFILE_MAP: ProfileMap =
    RobotCleanerProfile._PROFILE;
export const ROBOT_CLEANER_CUSTOM_PROPERTIES: CustomProperties =
    RobotCleanerProfile._CUSTOM_PROPERTIES;
export const ROBOT_CLEANER_LOCATION_MAP: LocationMap =
    RobotCleanerProfile._LOCATION_MAP;
export const ROBOT_CLEANER_PROFILE_DEFINITION: ConnectDeviceProfileDefinition =
    {
        resourceMap: ROBOT_CLEANER_RESOURCE_MAP,
        profileMap: ROBOT_CLEANER_PROFILE_MAP,
        locationMap: ROBOT_CLEANER_LOCATION_MAP,
        customProperties: ROBOT_CLEANER_CUSTOM_PROPERTIES,
    };
export const createRobotCleanerProfile = (
    profile: Record<string, DynamicObjectOrStringArray>,
): ConnectDeviceProfile =>
    createConnectDeviceProfile(profile, ROBOT_CLEANER_PROFILE_DEFINITION);

export class RobotCleanerDevice extends ConnectBaseDevice {
    static _CUSTOM_SET_PROPERTY_NAME = {
        absoluteHourToStart: "absoluteTimeToStart",
        absoluteMinuteToStart: "absoluteTimeToStart",
    };
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
            createRobotCleanerProfile(profile),
            RobotCleanerDevice._CUSTOM_SET_PROPERTY_NAME,
            undefined,
            energyProfile,
        );
    }

    get profiles(): ConnectDeviceProfile {
        return this._profiles;
    }

    setCleanOperationMode = async (
        mode: string,
    ): Promise<ThinQApiResponse | undefined> => {
        return await this.doEnumAttributeCommand("cleanOperationMode", mode);
    };

    setAbsoluteTimeToStart = async (
        hour: number,
        minute: number,
    ): Promise<ThinQApiResponse> => {
        return await this.doMultiAttributeCommand({
            absoluteHourToStart: hour,
            absoluteMinuteToStart: minute,
        });
    };
}
