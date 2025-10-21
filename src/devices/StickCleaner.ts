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

export class StickCleanerProfile extends ConnectDeviceProfile {
    static _RESOURCE_MAP: ResourceMap = {
        runState: "runState",
        stickCleanerJobMode: "stickCleanerJobMode",
        battery: "battery",
    };
    static _PROFILE: ProfileMap = {
        runState: { currentState: "currentState" },
        stickCleanerJobMode: { currentJobMode: "currentJobMode" },
        battery: { level: "batteryLevel", percent: "batteryPercent" },
    };
    static _CUSTOM_PROPERTIES: CustomProperties = [];
    static _LOCATION_MAP: LocationMap = {};

    constructor(profile: Record<string, any>) {
        super(
            profile,
            StickCleanerProfile._RESOURCE_MAP,
            StickCleanerProfile._PROFILE,
            StickCleanerProfile._LOCATION_MAP,
            StickCleanerProfile._CUSTOM_PROPERTIES,
        );
    }
}

export class StickCleanerDevice extends ConnectBaseDevice {
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
            new StickCleanerProfile(profile),
            undefined,
            undefined,
            energyProfile,
        );
    }

    get profiles(): ConnectDeviceProfile {
        return this._profiles;
    }
}
