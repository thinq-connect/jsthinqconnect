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

export class HoodProfile extends ConnectDeviceProfile {
    static _RESOURCE_MAP: ResourceMap = {
        ventilation: "ventilation",
        lamp: "lamp",
        operation: "operation",
    };
    static _PROFILE: ProfileMap = {
        ventilation: { fanSpeed: "fanSpeed" },
        lamp: { lampBrightness: "lampBrightness" },
        operation: { hoodOperationMode: "hoodOperationMode" },
    };
    static _CUSTOM_PROPERTIES: CustomProperties = [];
    static _LOCATION_MAP: LocationMap = {};

    constructor(profile: Record<string, any>) {
        super(
            profile,
            HoodProfile._RESOURCE_MAP,
            HoodProfile._PROFILE,
            HoodProfile._LOCATION_MAP,
            HoodProfile._CUSTOM_PROPERTIES,
        );
    }
}

export class HoodDevice extends ConnectBaseDevice {
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
            new HoodProfile(profile),
            undefined,
            undefined,
            energyProfile,
        );
    }

    get profiles(): ConnectDeviceProfile {
        return this._profiles;
    }

    setFanSpeedLampBrightness = async (
        fanSpeed: number,
        lampBrightness: number,
    ): Promise<ThinQApiResponse> => {
        return await this.doMultiRangeAttributeCommand({
            fanSpeed: fanSpeed,
            lampBrightness: lampBrightness,
        });
    };

    setFanSpeed = async (fanSpeed: number): Promise<ThinQApiResponse> => {
        return await this.doMultiRangeAttributeCommand({
            fanSpeed: fanSpeed,
            lampBrightness: this.lampBrightness,
        });
    };

    setLampBrightness = async (
        lampBrightness: number,
    ): Promise<ThinQApiResponse> => {
        return await this.doMultiRangeAttributeCommand({
            fanSpeed: this.fanSpeed,
            lampBrightness: lampBrightness,
        });
    };
}
