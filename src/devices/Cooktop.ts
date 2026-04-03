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
import { AttributePayload, DynamicObjectOrStringArray } from "../types/Devices";
import { ThinQApi, ThinQApiResponse } from "../ThinQAPI";

export const COOKTOP_SUB_RESOURCE_MAP: ResourceMap = {
    cookingZone: "cookingZone",
    power: "power",
    remoteControlEnable: "remoteControlEnable",
    timer: "timer",
};

export const COOKTOP_SUB_PROFILE_MAP: ProfileMap = {
    cookingZone: { currentState: "currentState" },
    power: { powerLevel: "powerLevel" },
    remoteControlEnable: { remoteControlEnabled: "remoteControlEnabled" },
    timer: { remainHour: "remainHour", remainMinute: "remainMinute" },
};
export const COOKTOP_SUB_CUSTOM_PROPERTIES: CustomProperties = [];
export const COOKTOP_SUB_LOCATION_MAP: LocationMap = {};

type CooktopPropertyEntry = Record<string, unknown>;
type CooktopLocationProperties = Record<string, Record<string, string[]>>;

const getCooktopProfileEntries = (
    profile: Record<string, DynamicObjectOrStringArray>,
): CooktopPropertyEntry[] => {
    const profileEntries = _.get(profile, "property", []);
    return Array.isArray(profileEntries)
        ? (profileEntries as CooktopPropertyEntry[])
        : [];
};

const getCooktopLocationName = (
    profileProperty: CooktopPropertyEntry,
): string | undefined => {
    return _.get(profileProperty, "location.locationName") as
        | string
        | undefined;
};

const initializeCooktopLocationProfiles = (
    mainProfile: CooktopProfile,
    profile: Record<string, DynamicObjectOrStringArray>,
): void => {
    const locationProperties: CooktopLocationProperties = {};
    for (const profileProperty of getCooktopProfileEntries(profile)) {
        const locationName = getCooktopLocationName(profileProperty);
        if (!locationName || !(locationName in COOKTOP_LOCATION_MAP)) {
            continue;
        }
        const attrKey = COOKTOP_LOCATION_MAP[locationName];
        const subProfile = createCooktopSubProfile(profile, locationName);
        mainProfile[attrKey] = subProfile;
        locationProperties[attrKey] = subProfile.properties;
    }
    mainProfile._locationProperties = locationProperties;
};

const getCooktopLocationPropertyEntries = (
    property:
        | CooktopPropertyEntry
        | CooktopPropertyEntry[]
        | Record<string, unknown>[],
    locationName: string | null,
): CooktopPropertyEntry[] => {
    if (!Array.isArray(property)) {
        return [property];
    }
    return property.filter(
        (locationProperty) =>
            getCooktopLocationName(locationProperty) === locationName,
    );
};

export class CooktopSubProfile extends ConnectDeviceProfile {
    static _RESOURCE_MAP: ResourceMap = COOKTOP_SUB_RESOURCE_MAP;
    static _PROFILE: ProfileMap = COOKTOP_SUB_PROFILE_MAP;
    static _CUSTOM_PROPERTIES: CustomProperties = COOKTOP_SUB_CUSTOM_PROPERTIES;
    static _LOCATION_MAP: LocationMap = COOKTOP_SUB_LOCATION_MAP;

    constructor(
        profile: Record<string, DynamicObjectOrStringArray>,
        locationName: string,
    ) {
        super(
            profile,
            COOKTOP_SUB_RESOURCE_MAP,
            COOKTOP_SUB_PROFILE_MAP,
            COOKTOP_SUB_LOCATION_MAP,
            COOKTOP_SUB_CUSTOM_PROPERTIES,
            false,
            false,
            locationName,
        );
        this._locationName = locationName;
    }

    generateProperties(
        property: CooktopPropertyEntry | CooktopPropertyEntry[],
    ): void {
        for (const locationProperty of getCooktopLocationPropertyEntries(
            property,
            this._locationName,
        )) {
            super.generateProperties(locationProperty);
        }
    }
}

export const COOKTOP_RESOURCE_MAP: ResourceMap = { operation: "operation" };
export const COOKTOP_PROFILE_MAP: ProfileMap = {
    operation: { operationMode: "operationMode" },
};
export const COOKTOP_LOCATION_MAP: LocationMap = {
    CENTER: "center",
    CENTER_FRONT: "centerFront",
    CENTER_REAR: "centerRear",
    LEFT_FRONT: "leftFront",
    LEFT_REAR: "leftRear",
    RIGHT_FRONT: "rightFront",
    RIGHT_REAR: "rightRear",
    BURNER_1: "burner_1",
    BURNER_2: "burner_2",
    BURNER_3: "burner_3",
    BURNER_4: "burner_4",
    BURNER_5: "burner_5",
    BURNER_6: "burner_6",
    BURNER_7: "burner_7",
    BURNER_8: "burner_8",
    INDUCTION_1: "induction_1",
    INDUCTION_2: "induction_2",
    SOUSVIDE_1: "sousvide_1",
};
export const COOKTOP_CUSTOM_PROPERTIES: CustomProperties = [];

export class CooktopProfile extends ConnectDeviceProfile {
    static _RESOURCE_MAP: ResourceMap = COOKTOP_RESOURCE_MAP;
    static _PROFILE: ProfileMap = COOKTOP_PROFILE_MAP;
    static _LOCATION_MAP: LocationMap = COOKTOP_LOCATION_MAP;
    static _CUSTOM_PROPERTIES: CustomProperties = COOKTOP_CUSTOM_PROPERTIES;
    constructor(profile: Record<string, DynamicObjectOrStringArray>) {
        super(
            profile,
            COOKTOP_RESOURCE_MAP,
            COOKTOP_PROFILE_MAP,
            COOKTOP_LOCATION_MAP,
            COOKTOP_CUSTOM_PROPERTIES,
            true,
            false,
        );
        initializeCooktopLocationProfiles(this, profile);
    }
}

export const createCooktopSubProfile = (
    profile: Record<string, DynamicObjectOrStringArray>,
    locationName: string,
): ConnectDeviceProfile => {
    return new CooktopSubProfile(profile, locationName);
};

export const createCooktopProfile = (
    profile: Record<string, DynamicObjectOrStringArray>,
): ConnectDeviceProfile => {
    return new CooktopProfile(profile);
};

export class CooktopSubDevice extends ConnectSubDevice {
    constructor(
        profiles: ConnectDeviceProfile,
        locationName: string,
        thinqApi: ThinQApi,
        deviceId: string,
        deviceType: string,
        modelName: string,
        alias: string,
        reportable: boolean,
        singleUnit: boolean,
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

    _getCommandPayload = (): Record<string, unknown> => {
        return {
            power: { powerLevel: this.getStatus("powerLevel") },
            timer: {
                remainHour: this.getStatus("remainHour"),
                remainMinute: this.getStatus("remainMinute"),
            },
            location: { locationName: this.locationName },
        };
    };

    _doCustomRangeAttributeCommand = async (
        attribute: string,
        value: number,
    ): Promise<ThinQApiResponse> => {
        const fullPayload: Record<string, unknown> = this._getCommandPayload();
        const payload = this.profiles.getRangeAttributePayload(
            attribute,
            value,
        ) as AttributePayload;
        for (const resource in payload) {
            fullPayload[resource] = payload[resource];
        }
        return await this.thinqApi.asyncPostDeviceControl(
            this.deviceId,
            fullPayload,
        );
    };

    setPowerLevel = async (level: number): Promise<ThinQApiResponse> => {
        return await this._doCustomRangeAttributeCommand("powerLevel", level);
    };

    setRemainHour = async (hour: number): Promise<ThinQApiResponse> => {
        return await this._doCustomRangeAttributeCommand("remainHour", hour);
    };

    setRemainMinute = async (minute: number): Promise<ThinQApiResponse> => {
        return await this._doCustomRangeAttributeCommand(
            "remainMinute",
            minute,
        );
    };
}

export class CooktopDevice extends ConnectMainDevice {
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
            createCooktopProfile(profile),
            CooktopSubDevice,
            energyProfile,
        );
    }

    get profiles(): ConnectDeviceProfile {
        return this._profiles;
    }

    getSubDevice(locationName: string): ConnectSubDevice | null {
        return super.getSubDevice(locationName) as ConnectSubDevice | null;
    }

    setOperationMode = async (
        mode: string,
    ): Promise<ThinQApiResponse | undefined> => {
        return await this.doEnumAttributeCommand("operationMode", mode);
    };

    setPowerLevel = async (
        locationName: string,
        value: number,
    ): Promise<ThinQApiResponse | undefined> => {
        const subDevice = this._subDevices[locationName] as
            | CooktopSubDevice
            | undefined;
        if (subDevice) {
            return await subDevice.setPowerLevel(value);
        } else {
            throw new Error(`Invalid location: ${locationName}`);
        }
    };

    setRemainHour = async (
        locationName: string,
        value: number,
    ): Promise<ThinQApiResponse | undefined> => {
        const subDevice = this._subDevices[locationName] as
            | CooktopSubDevice
            | undefined;
        if (subDevice) {
            return await subDevice.setRemainHour(value);
        } else {
            throw new Error(`Invalid location: ${locationName}`);
        }
    };

    setRemainMinute = async (
        locationName: string,
        value: number,
    ): Promise<ThinQApiResponse | undefined> => {
        const subDevice = this._subDevices[locationName] as
            | CooktopSubDevice
            | undefined;
        if (subDevice) {
            return await subDevice.setRemainMinute(value);
        } else {
            throw new Error(`Invalid location: ${locationName}`);
        }
    };
}
