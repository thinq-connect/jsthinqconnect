/*
 * SPDX-FileCopyrightText: Copyright 2025 LG Electronics Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import _ from "lodash";
import {
    ConnectDeviceProfile,
    ConnectDeviceProfileDefinition,
} from "./ConnectDevice";
import {
    ResourceMap,
    ProfileMap,
    CustomProperties,
    LocationMap,
} from "../types/Resources";
import { DynamicObjectOrStringArray } from "../types/Devices";
import { WasherSubDevice } from "./Washer";
import { ThinQApi, ThinQApiResponse } from "../ThinQAPI";

export const WASHCOMBO_RESOURCE_MAP: ResourceMap = {
    runState: "runState",
    operation: "operation",
    mode: "mode",
    remoteControlEnable: "remoteControlEnable",
    timer: "timer",
    detergent: "detergent",
    cycle: "cycle",
};

export const WASHCOMBO_PROFILE_MAP: ProfileMap = {
    runState: { currentState: "currentState" },
    operation: { washerOperationMode: "washerOperationMode" },
    mode: {
        washerMode: "washerMode",
    },
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
    detergent: { detergentSetting: "detergentSetting" },
    cycle: { cycleCount: "cycleCount" },
};
export const WASHCOMBO_CUSTOM_PROPERTIES: CustomProperties = [];
export const WASHCOMBO_LOCATION_MAP: LocationMap = {};

export const WASHCOMBO_PROFILE_DEFINITION: ConnectDeviceProfileDefinition = {
    resourceMap: WASHCOMBO_RESOURCE_MAP,
    profileMap: WASHCOMBO_PROFILE_MAP,
    locationMap: WASHCOMBO_LOCATION_MAP,
    customProperties: WASHCOMBO_CUSTOM_PROPERTIES,
};

export class WashcomboProfile extends ConnectDeviceProfile {
    static _RESOURCE_MAP: ResourceMap = WASHCOMBO_RESOURCE_MAP;
    static _PROFILE: ProfileMap = WASHCOMBO_PROFILE_MAP;
    static _CUSTOM_PROPERTIES: CustomProperties = WASHCOMBO_CUSTOM_PROPERTIES;
    static _LOCATION_MAP: LocationMap = WASHCOMBO_LOCATION_MAP;

    constructor(
        profile: Record<string, DynamicObjectOrStringArray>,
        locationName: string | null = null,
        useNotification = false,
    ) {
        super(
            profile,
            WASHCOMBO_PROFILE_DEFINITION.resourceMap,
            WASHCOMBO_PROFILE_DEFINITION.profileMap,
            WASHCOMBO_PROFILE_DEFINITION.locationMap,
            WASHCOMBO_PROFILE_DEFINITION.customProperties,
            false,
            false,
            locationName,
            useNotification,
        );
        this._locationName = locationName;
    }

    generateProperties(property: Record<string, unknown>[]): void {
        if (Array.isArray(property)) {
            for (const locationProperty of property) {
                if (
                    _.get(locationProperty, "location.locationName") !==
                    this._locationName
                ) {
                    continue;
                }
                super.generateProperties(locationProperty);
            }
        } else {
            super.generateProperties(property);
        }
    }
}

export const createWashcomboProfile = (
    profile: Record<string, DynamicObjectOrStringArray>,
    locationName: string | null = null,
    useNotification = false,
): ConnectDeviceProfile => {
    return new WashcomboProfile(profile, locationName, useNotification);
};

export class WashcomboDevice extends WasherSubDevice {
    constructor(
        thinqApi: ThinQApi,
        deviceId: string,
        deviceType: string,
        modelName: string,
        alias: string,
        groupId: string,
        reportable: boolean,
        profile: Record<string, DynamicObjectOrStringArray>,
        location: string,
        energyProfile?: Record<string, unknown>,
    ) {
        super(
            createWashcomboProfile(profile, location, true),
            location,
            thinqApi,
            deviceId,
            deviceType,
            modelName,
            alias,
            reportable,
            undefined,
            energyProfile,
        );
        this._groupId = groupId;
        this._location = location;
    }

    get groupId(): string {
        return this._groupId;
    }

    set groupId(groupId: string) {
        this._groupId = groupId;
    }

    get location(): string {
        return this._location;
    }

    set location(location: string) {
        this._location = location;
    }

    setWasherOperationMode = async (
        operation: string,
    ): Promise<ThinQApiResponse> => {
        const payload = this.profiles.getEnumAttributePayload(
            "washerOperationMode",
            operation,
        );
        return await this._doAttributeCommand({
            location: { locationName: this._location },
            ...payload,
        });
    };

    setRelativeHourToStart = async (
        hour: number,
    ): Promise<ThinQApiResponse> => {
        const payload = this.profiles.getRangeAttributePayload(
            "relativeHourToStart",
            hour,
        );
        return await this._doAttributeCommand({
            location: { locationName: this._location },
            ...payload,
        });
    };

    setRelativeHourToStop = async (hour: number): Promise<ThinQApiResponse> => {
        const payload = this.profiles.getRangeAttributePayload(
            "relativeHourToStop",
            hour,
        );
        return await this._doAttributeCommand({
            location: { locationName: this._location },
            ...payload,
        });
    };

    setWasherMode = async (mode: string): Promise<ThinQApiResponse> => {
        const operationPayload = this.profiles.getEnumAttributePayload(
            "washerOperationMode",
            "START",
        );
        const payload = this.profiles.getEnumAttributePayload(
            "washerMode",
            mode,
        );
        return await this._doAttributeCommand({
            location: { locationName: this._location },
            ...operationPayload,
            ...payload,
        });
    };
}
