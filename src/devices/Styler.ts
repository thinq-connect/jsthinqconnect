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
import { ResourceMap, ProfileMap } from "../types/Resources";
import { DynamicObjectOrStringArray } from "../types/Devices";
import { ThinQApi, ThinQApiResponse } from "../ThinQAPI";

export class StylerProfile extends ConnectDeviceProfile {
    static _RESOURCE_MAP: ResourceMap = {
        runState: "runState",
        operation: "operation",
        remoteControlEnable: "remoteControlEnable",
        timer: "timer",
    };
    static _PROFILE: ProfileMap = {
        runState: { currentState: "currentState" },
        operation: { stylerOperationMode: "stylerOperationMode" },
        remoteControlEnable: { remoteControlEnabled: "remoteControlEnabled" },
        timer: {
            relativeHourToStop: "relativeHourToStop",
            relativeMinuteToStop: "relativeMinuteToStop",
            remainHour: "remainHour",
            remainMinute: "remainMinute",
            totalHour: "totalHour",
            totalMinute: "totalMinute",
        },
    };
    constructor(profile: Record<string, any>) {
        super(profile, StylerProfile._RESOURCE_MAP, StylerProfile._PROFILE);
    }
}

export const STYLER_RESOURCE_MAP: ResourceMap = StylerProfile._RESOURCE_MAP;
export const STYLER_PROFILE_MAP: ProfileMap = StylerProfile._PROFILE;
export const STYLER_PROFILE_DEFINITION: ConnectDeviceProfileDefinition = {
    resourceMap: STYLER_RESOURCE_MAP,
    profileMap: STYLER_PROFILE_MAP,
};
export const createStylerProfile = (
    profile: Record<string, DynamicObjectOrStringArray>,
): ConnectDeviceProfile =>
    createConnectDeviceProfile(profile, STYLER_PROFILE_DEFINITION);

export class StylerDevice extends ConnectBaseDevice {
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
            createStylerProfile(profile),
            undefined,
            undefined,
            energyProfile,
        );
    }

    get profiles(): ConnectDeviceProfile {
        return this._profiles;
    }

    setStylerOperationMode = async (
        mode: string,
    ): Promise<ThinQApiResponse | undefined> => {
        return await this.doEnumAttributeCommand("stylerOperationMode", mode);
    };

    setRelativeHourToStop = async (
        hour: number,
    ): Promise<ThinQApiResponse | undefined> => {
        return await this.doRangeAttributeCommand("relativeHourToStop", hour);
    };
}
