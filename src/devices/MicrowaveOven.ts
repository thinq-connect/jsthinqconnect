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

export class MicrowaveOvenProfile extends ConnectDeviceProfile {
    static _RESOURCE_MAP: ResourceMap = {
        runState: "runState",
        timer: "timer",
        ventilation: "ventilation",
        lamp: "lamp",
    };

    static _PROFILE: ProfileMap = {
        runState: { currentState: "currentState" },
        timer: { remainMinute: "remainMinute", remainSecond: "remainSecond" },
        ventilation: { fanSpeed: "fanSpeed" },
        lamp: { lampBrightness: "lampBrightness" },
    };
    static _CUSTOM_PROPERTIES: CustomProperties = [];
    static _LOCATION_MAP: LocationMap = {};

    constructor(profile: Record<string, any>) {
        super(
            profile,
            MicrowaveOvenProfile._RESOURCE_MAP,
            MicrowaveOvenProfile._PROFILE,
            MicrowaveOvenProfile._LOCATION_MAP,
            MicrowaveOvenProfile._CUSTOM_PROPERTIES,
        );
    }
}

export const MICROWAVE_OVEN_RESOURCE_MAP: ResourceMap =
    MicrowaveOvenProfile._RESOURCE_MAP;
export const MICROWAVE_OVEN_PROFILE_MAP: ProfileMap =
    MicrowaveOvenProfile._PROFILE;
export const MICROWAVE_OVEN_CUSTOM_PROPERTIES: CustomProperties =
    MicrowaveOvenProfile._CUSTOM_PROPERTIES;
export const MICROWAVE_OVEN_LOCATION_MAP: LocationMap =
    MicrowaveOvenProfile._LOCATION_MAP;
export const MICROWAVE_OVEN_PROFILE_DEFINITION: ConnectDeviceProfileDefinition =
    {
        resourceMap: MICROWAVE_OVEN_RESOURCE_MAP,
        profileMap: MICROWAVE_OVEN_PROFILE_MAP,
        locationMap: MICROWAVE_OVEN_LOCATION_MAP,
        customProperties: MICROWAVE_OVEN_CUSTOM_PROPERTIES,
    };
export const createMicrowaveOvenProfile = (
    profile: Record<string, DynamicObjectOrStringArray>,
): ConnectDeviceProfile =>
    createConnectDeviceProfile(profile, MICROWAVE_OVEN_PROFILE_DEFINITION);

export class MicrowaveOvenDevice extends ConnectBaseDevice {
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
            createMicrowaveOvenProfile(profile),
            undefined,
            undefined,
            energyProfile,
        );
    }

    get profiles(): ConnectDeviceProfile {
        return this._profiles;
    }

    setFanSpeed = async (speed: number): Promise<ThinQApiResponse> => {
        return await this.doMultiRangeAttributeCommand({
            lampBrightness: this.getStatus("lampBrightness"),
            fanSpeed: speed,
        });
    };

    setFanSpeedLampBrightness = async (
        speed: number,
        brightness: number,
    ): Promise<ThinQApiResponse> => {
        return await this.doMultiRangeAttributeCommand({
            fanSpeed: speed,
            lampBrightness: brightness,
        });
    };

    setLampBrightness = async (
        brightness: number,
    ): Promise<ThinQApiResponse> => {
        return await this.doMultiRangeAttributeCommand({
            lampBrightness: brightness,
            fanSpeed: this.getStatus("fanSpeed"),
        });
    };
}
