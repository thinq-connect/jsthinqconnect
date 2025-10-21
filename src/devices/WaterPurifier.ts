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
import { ThinQApi } from "../ThinQAPI";

export class WaterPurifierProfile extends ConnectDeviceProfile {
    static _RESOURCE_MAP: ResourceMap = {
        runState: "runState",
        waterInfo: "waterInfo",
    };
    static _PROFILE: ProfileMap = {
        runState: {
            cockState: "cockState",
            sterilizingState: "sterilizingState",
        },
        waterInfo: { waterType: "waterType" },
    };
    static _CUSTOM_PROPERTIES: CustomProperties = [];
    static _LOCATION_MAP: LocationMap = {};

    constructor(profile: Record<string, any>) {
        super(
            profile,
            WaterPurifierProfile._RESOURCE_MAP,
            WaterPurifierProfile._PROFILE,
            WaterPurifierProfile._LOCATION_MAP,
            WaterPurifierProfile._CUSTOM_PROPERTIES,
        );
    }
}

export class WaterPurifierDevice extends ConnectBaseDevice {
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
            new WaterPurifierProfile(profile),
            undefined,
            undefined,
            energyProfile,
        );
    }

    get profiles(): ConnectDeviceProfile {
        return this._profiles;
    }
}
