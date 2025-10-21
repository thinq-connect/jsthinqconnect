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
            new RobotCleanerProfile(profile),
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
