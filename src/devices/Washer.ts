/*
 * SPDX-FileCopyrightText: Copyright 2025 LG Electronics Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import _ from "lodash";
import {
    ConnectMainDevice,
    ConnectSubDevice,
    ConnectDeviceProfile,
} from "./ConnectDevice";
import {
    ResourceMap,
    ProfileMap,
    CustomProperties,
    LocationMap,
} from "../types/Resources";
import { DynamicObjectOrObjectArray } from "../types/Devices";
import { ThinQApi, ThinQApiResponse } from "../ThinQAPI";

export class WasherProfile extends ConnectDeviceProfile {
    static _RESOURCE_MAP: ResourceMap = {};
    static _PROFILE: ProfileMap = {};
    static _LOCATION_MAP: LocationMap = { MAIN: "main", MINI: "mini" };
    static _CUSTOM_PROPERTIES: CustomProperties = [];
    constructor(profile: Record<string, any>) {
        super(
            profile,
            WasherProfile._RESOURCE_MAP,
            WasherProfile._PROFILE,
            WasherProfile._LOCATION_MAP,
            WasherProfile._CUSTOM_PROPERTIES,
            false,
            true,
        );
        const _locationProperties: Record<
            string,
            Record<string, string[]>
        > = {};
        for (const profileProperty of _.get(profile, "property", [])) {
            const locationName = _.get(
                profileProperty,
                "location.locationName",
            );
            if (locationName in WasherProfile._LOCATION_MAP) {
                const attrKey = WasherProfile._LOCATION_MAP[locationName];
                const _subProfile = new WasherSubProfile(profile, locationName);
                this[attrKey] = _subProfile;
                _locationProperties[attrKey] = _subProfile.properties;
            }
        }
        this._locationProperties = _locationProperties;
        this.generatePropertyMap();
    }
}

export class WasherSubProfile extends ConnectDeviceProfile {
    static _RESOURCE_MAP: ResourceMap = {
        runState: "runState",
        operation: "operation",
        remoteControlEnable: "remoteControlEnable",
        timer: "timer",
        detergent: "detergent",
        cycle: "cycle",
    };

    static _PROFILE: ProfileMap = {
        runState: { currentState: "currentState" },
        operation: { washerOperationMode: "washerOperationMode" },
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
    static _CUSTOM_PROPERTIES: CustomProperties = [];
    static _LOCATION_MAP: LocationMap = {};

    constructor(
        profile: Record<string, any>,
        locationName: string | null = null,
        useNotification = false,
    ) {
        super(
            profile,
            WasherSubProfile._RESOURCE_MAP,
            WasherSubProfile._PROFILE,
            WasherSubProfile._LOCATION_MAP,
            WasherSubProfile._CUSTOM_PROPERTIES,
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

export class WasherSubDevice extends ConnectSubDevice {
    constructor(
        profiles: ConnectDeviceProfile,
        locationName: string,
        thinqApi: ThinQApi,
        deviceId: string,
        deviceType: string,
        modelName: string,
        alias: string,
        reportable: boolean,
        singleUnit = false,
        energyProfile?: Record<string, unknown>,
    ) {
        super(
            profiles,
            locationName,
            thinqApi,
            deviceId,
            deviceType,
            modelName,
            alias,
            reportable,
            singleUnit,
            undefined,
            energyProfile,
        );
    }

    get profiles(): ConnectDeviceProfile {
        return this._profiles;
    }

    get remainTime(): Record<string, number> {
        return {
            hour: this.getStatus("remainHour") as number,
            minute: this.getStatus("remainMinute") as number,
        };
    }

    get totalTime(): Record<string, number> {
        return {
            hour: this.getStatus("totalHour") as number,
            minute: this.getStatus("totalMinute") as number,
        };
    }

    get relativeTimeToStop(): Record<string, number> {
        return {
            hour: this.getStatus("relativeHourToStop") as number,
            minute: this.getStatus("relativeMinuteToStop") as number,
        };
    }

    get relativeTimeToStart(): Record<string, number> {
        return {
            hour: this.getStatus("relativeHourToStart") as number,
            minute: this.getStatus("relativeMinuteToStart") as number,
        };
    }

    _setStatus(status: DynamicObjectOrObjectArray, isUpdated = false): null {
        if (Array.isArray(status)) super._setStatus(status, isUpdated);
        else super._setBaseStatus(status, isUpdated);
        return null;
    }

    setWasherOperationMode = async (
        mode: string,
    ): Promise<ThinQApiResponse | undefined> => {
        const payload = this.profiles.getEnumAttributePayload(
            "washerOperationMode",
            mode,
        );
        if (payload)
            return await this._doAttributeCommand({
                location: { locationName: this._locationName },
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
            location: { locationName: this._locationName },
            ...payload,
        });
    };

    setRelativeHourToStop = async (hour: number): Promise<ThinQApiResponse> => {
        const payload = this.profiles.getRangeAttributePayload(
            "relativeHourToStop",
            hour,
        );
        return await this._doAttributeCommand({
            location: { locationName: this._locationName },
            ...payload,
        });
    };
}

export class WasherDevice extends ConnectMainDevice {
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
            new WasherProfile(profile),
            WasherSubDevice,
            energyProfile,
        );
    }

    get profiles(): ConnectDeviceProfile {
        return this._profiles;
    }

    getSubDevice(locationName: string): ConnectSubDevice | null {
        return super.getSubDevice(locationName);
    }
}
