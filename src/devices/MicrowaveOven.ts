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

export class MicrowaveOvenDevice extends ConnectBaseDevice {
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
            new MicrowaveOvenProfile(profile),
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
