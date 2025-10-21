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

export class DryerProfile extends ConnectDeviceProfile {
    static _RESOURCE_MAP: ResourceMap = {
        runState: "runState",
        operation: "operation",
        remoteControlEnable: "remoteControlEnable",
        timer: "timer",
    };
    static _PROFILE: ProfileMap = {
        runState: { currentState: "currentState" },
        operation: { dryerOperationMode: "dryerOperationMode" },
        remoteControlEnable: { remoteControlEnabled: "remoteControlEnabled" },
        timer: {
            remainHour: "remainHour",
            remainMinute: "remainMinute",
            totalHour: "totalHour",
            totalMinute: "totalMinute",
            relativeHourToStop: "relativeHourToStop",
            relativeMinuteToStop: "relativeMinuteToStop",
            relativeHourToStart: "relativeHourToStart",
            relativeMinuteToStart: "relativeMinuteToStart",
        },
    };
    static _CUSTOM_PROPERTIES: CustomProperties = [];
    static _LOCATION_MAP: LocationMap = {};

    constructor(profile: Record<string, any>) {
        super(
            profile,
            DryerProfile._RESOURCE_MAP,
            DryerProfile._PROFILE,
            DryerProfile._LOCATION_MAP,
            DryerProfile._CUSTOM_PROPERTIES,
        );
    }
}

export class DryerDevice extends ConnectBaseDevice {
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
            new DryerProfile(profile),
            undefined,
            undefined,
            energyProfile,
        );
    }

    get profiles(): ConnectDeviceProfile {
        return this._profiles;
    }

    setDryerOperationMode = async (
        mode: string,
    ): Promise<ThinQApiResponse | undefined> => {
        return await this.doEnumAttributeCommand("dryerOperationMode", mode);
    };

    setRelativeHourToStart = async (
        hour: number,
    ): Promise<ThinQApiResponse | undefined> => {
        return await this.doAttributeCommand("relativeHourToStart", hour);
    };

    setRelativeHourToStop = async (
        hour: number,
    ): Promise<ThinQApiResponse | undefined> => {
        return await this.doRangeAttributeCommand("relativeHourToStop", hour);
    };
}
