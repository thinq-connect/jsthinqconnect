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

export class CeilingFanProfile extends ConnectDeviceProfile {
    static _RESOURCE_MAP: ResourceMap = {
        airFlow: "airFlow",
        operation: "operation",
    };
    static _PROFILE: ProfileMap = {
        airFlow: { windStrength: "windStrength" },
        operation: { ceilingfanOperationMode: "ceilingfanOperationMode" },
    };
    static _CUSTOM_PROPERTIES: CustomProperties = [];
    static _LOCATION_MAP: LocationMap = {};

    constructor(profile: Record<string, any>) {
        super(
            profile,
            CeilingFanProfile._RESOURCE_MAP,
            CeilingFanProfile._PROFILE,
            CeilingFanProfile._LOCATION_MAP,
            CeilingFanProfile._CUSTOM_PROPERTIES,
        );
    }
}

export class CeilingFanDevice extends ConnectBaseDevice {
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
            new CeilingFanProfile(profile),
            undefined,
            undefined,
            energyProfile,
        );
    }

    get profiles(): ConnectDeviceProfile {
        return this._profiles;
    }

    setCeilingfanOperationMode = async (
        mode: string,
    ): Promise<ThinQApiResponse | undefined> => {
        return await this.doEnumAttributeCommand(
            "ceilingfanOperationMode",
            mode,
        );
    };

    setWindStrength = async (
        strength: string,
    ): Promise<ThinQApiResponse | undefined> => {
        return await this.doEnumAttributeCommand("windStrength", strength);
    };
}
