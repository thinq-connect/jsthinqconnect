/*
 * SPDX-FileCopyrightText: Copyright 2025 LG Electronics Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import _ from "lodash";
import {
    ConnectMainDevice,
    ConnectSubDevice,
    ConnectDeviceProfile,
    ConnectDeviceProfileDefinition,
} from "./ConnectDevice";
import {
    ResourceMap,
    ProfileMap,
    CustomProperties,
    LocationMap,
} from "../types/Resources";
import {
    DynamicObjectOrObjectArray,
    DynamicObjectOrStringArray,
} from "../types/Devices";
import { ThinQApi, ThinQApiResponse } from "../ThinQAPI";

export const WASHER_RESOURCE_MAP: ResourceMap = {};
export const WASHER_PROFILE_MAP: ProfileMap = {};
export const WASHER_LOCATION_MAP: LocationMap = { MAIN: "main", MINI: "mini" };
export const WASHER_CUSTOM_PROPERTIES: CustomProperties = [];

export const WASHER_PROFILE_DEFINITION: ConnectDeviceProfileDefinition = {
    resourceMap: WASHER_RESOURCE_MAP,
    profileMap: WASHER_PROFILE_MAP,
    locationMap: WASHER_LOCATION_MAP,
    customProperties: WASHER_CUSTOM_PROPERTIES,
    useSubProfileOnly: true,
};

export const WASHER_SUB_RESOURCE_MAP: ResourceMap = {
    runState: "runState",
    operation: "operation",
    remoteControlEnable: "remoteControlEnable",
    timer: "timer",
    detergent: "detergent",
    cycle: "cycle",
};

export const WASHER_SUB_PROFILE_MAP: ProfileMap = {
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
export const WASHER_SUB_LOCATION_MAP: LocationMap = {};

type WasherPropertyEntry = Record<string, unknown>;
type WasherLocationProperties = Record<string, Record<string, string[]>>;

const getWasherProfileEntries = (
    profile: Record<string, DynamicObjectOrStringArray>,
): WasherPropertyEntry[] => {
    const profileEntries = _.get(profile, "property", []);
    return Array.isArray(profileEntries)
        ? (profileEntries as WasherPropertyEntry[])
        : [];
};

const getWasherLocationName = (
    profileProperty: WasherPropertyEntry,
): string | undefined => {
    return _.get(profileProperty, "location.locationName") as
        | string
        | undefined;
};

const initializeWasherLocationProfiles = (
    mainProfile: WasherProfile,
    profile: Record<string, DynamicObjectOrStringArray>,
): void => {
    const locationProperties: WasherLocationProperties = {};
    for (const profileProperty of getWasherProfileEntries(profile)) {
        const locationName = getWasherLocationName(profileProperty);
        if (!locationName || !(locationName in WASHER_LOCATION_MAP)) {
            continue;
        }
        const attrKey = WASHER_LOCATION_MAP[locationName];
        const subProfile = createWasherSubProfile(profile, locationName);
        mainProfile[attrKey] = subProfile;
        locationProperties[attrKey] = subProfile.properties;
    }
    mainProfile._locationProperties = locationProperties;
    mainProfile.generatePropertyMap();
};

const getWasherLocationPropertyEntries = (
    property:
        | WasherPropertyEntry
        | WasherPropertyEntry[]
        | Record<string, unknown>[],
    locationName: string | null,
): WasherPropertyEntry[] => {
    if (!Array.isArray(property)) {
        return [property];
    }
    return property.filter(
        (locationProperty) =>
            getWasherLocationName(locationProperty) === locationName,
    );
};

export class WasherProfile extends ConnectDeviceProfile {
    static _RESOURCE_MAP: ResourceMap = WASHER_RESOURCE_MAP;
    static _PROFILE: ProfileMap = WASHER_PROFILE_MAP;
    static _LOCATION_MAP: LocationMap = WASHER_LOCATION_MAP;
    static _CUSTOM_PROPERTIES: CustomProperties = WASHER_CUSTOM_PROPERTIES;
    constructor(profile: Record<string, DynamicObjectOrStringArray>) {
        super(
            profile,
            WASHER_PROFILE_DEFINITION.resourceMap,
            WASHER_PROFILE_DEFINITION.profileMap,
            WASHER_PROFILE_DEFINITION.locationMap,
            WASHER_PROFILE_DEFINITION.customProperties,
            WASHER_PROFILE_DEFINITION.useExtensionProperty,
            WASHER_PROFILE_DEFINITION.useSubProfileOnly,
        );
        initializeWasherLocationProfiles(this, profile);
    }
}

export class WasherSubProfile extends ConnectDeviceProfile {
    static _RESOURCE_MAP: ResourceMap = WASHER_SUB_RESOURCE_MAP;
    static _PROFILE: ProfileMap = WASHER_SUB_PROFILE_MAP;
    static _CUSTOM_PROPERTIES: CustomProperties = [];
    static _LOCATION_MAP: LocationMap = WASHER_SUB_LOCATION_MAP;

    constructor(
        profile: Record<string, DynamicObjectOrStringArray>,
        locationName: string | null = null,
        useNotification = false,
    ) {
        super(
            profile,
            WASHER_SUB_RESOURCE_MAP,
            WASHER_SUB_PROFILE_MAP,
            WASHER_SUB_LOCATION_MAP,
            WASHER_CUSTOM_PROPERTIES,
            false,
            false,
            locationName,
            useNotification,
        );
        this._locationName = locationName;
    }

    generateProperties(
        property: WasherPropertyEntry[] | WasherPropertyEntry,
    ): void {
        for (const locationProperty of getWasherLocationPropertyEntries(
            property,
            this._locationName,
        )) {
            super.generateProperties(locationProperty);
        }
    }
}

export const createWasherSubProfile = (
    profile: Record<string, DynamicObjectOrStringArray>,
    locationName: string,
    useNotification = false,
): ConnectDeviceProfile => {
    return new WasherSubProfile(profile, locationName, useNotification);
};

export const createWasherProfile = (
    profile: Record<string, DynamicObjectOrStringArray>,
): ConnectDeviceProfile => {
    return new WasherProfile(profile);
};

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
            createWasherProfile(profile),
            WasherSubDevice,
            energyProfile,
        );
    }

    get profiles(): ConnectDeviceProfile {
        return this._profiles;
    }

    getSubDevice(locationName: string): ConnectSubDevice | null {
        return super.getSubDevice(locationName) as ConnectSubDevice | null;
    }
}
