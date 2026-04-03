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
    READABILITY,
    WRITABILITY,
    CustomResourcePropertiesHandler,
} from "./ConnectDevice";
import {
    ResourceMap,
    ProfileMap,
    LocationMap,
    CustomProperties,
} from "../types/Resources";
import { DynamicObjectOrStringArray } from "../types/Devices";
import { ThinQApi } from "../ThinQAPI";

export const KIMCHI_REFRIGERATOR_SUB_RESOURCE_MAP: ResourceMap = {
    temperature: "temperature",
};

export const KIMCHI_REFRIGERATOR_SUB_PROFILE_MAP: ProfileMap = {
    temperature: {
        locationName: "locationName",
        targetTemperature: "targetTemperature",
    },
};
export const KIMCHI_REFRIGERATOR_SUB_CUSTOM_PROPERTIES: CustomProperties = [
    "temperature",
];
export const KIMCHI_REFRIGERATOR_SUB_LOCATION_MAP: LocationMap = {};

export const kimchiRefrigeratorSubCustomResourcePropertiesHandler: CustomResourcePropertiesHandler =
    (_resourceKey, resourceProperty, _props, profile): [string[], string[]] => {
        const readableProps: string[] = [];
        const writableProps: string[] = [];
        const locationName = profile._locationName;
        for (const temperature of resourceProperty as Record<
            string,
            unknown
        >[]) {
            if (temperature["locationName"] === locationName) {
                const attrName =
                    profile.getProfile()["temperature"]["targetTemperature"];
                const prop = profile._getProperties(
                    temperature as Record<string, DynamicObjectOrStringArray>,
                    "targetTemperature",
                );
                profile._setPropAttr(attrName, prop);
                if (prop[READABILITY]) readableProps.push(attrName);
                if (prop[WRITABILITY]) writableProps.push(attrName);
            }
        }
        return [readableProps, writableProps];
    };

export const KIMCHI_REFRIGERATOR_SUB_PROFILE_DEFINITION: ConnectDeviceProfileDefinition =
    {
        resourceMap: KIMCHI_REFRIGERATOR_SUB_RESOURCE_MAP,
        profileMap: KIMCHI_REFRIGERATOR_SUB_PROFILE_MAP,
        locationMap: KIMCHI_REFRIGERATOR_SUB_LOCATION_MAP,
        customProperties: KIMCHI_REFRIGERATOR_SUB_CUSTOM_PROPERTIES,
        customResourcePropertiesHandler:
            kimchiRefrigeratorSubCustomResourcePropertiesHandler,
        useNotification: false,
    };

export class KimchiRefrigeratorSubProfile extends ConnectDeviceProfile {
    static _RESOURCE_MAP: ResourceMap = KIMCHI_REFRIGERATOR_SUB_RESOURCE_MAP;
    static _PROFILE: ProfileMap = KIMCHI_REFRIGERATOR_SUB_PROFILE_MAP;
    static _CUSTOM_PROPERTIES: CustomProperties =
        KIMCHI_REFRIGERATOR_SUB_CUSTOM_PROPERTIES;
    static _LOCATION_MAP: LocationMap = KIMCHI_REFRIGERATOR_SUB_LOCATION_MAP;

    constructor(
        profile: Record<string, DynamicObjectOrStringArray>,
        locationName: string,
    ) {
        super(
            profile,
            KIMCHI_REFRIGERATOR_SUB_PROFILE_DEFINITION.resourceMap,
            KIMCHI_REFRIGERATOR_SUB_PROFILE_DEFINITION.profileMap,
            KIMCHI_REFRIGERATOR_SUB_PROFILE_DEFINITION.locationMap,
            KIMCHI_REFRIGERATOR_SUB_PROFILE_DEFINITION.customProperties,
            false,
            false,
            locationName,
            KIMCHI_REFRIGERATOR_SUB_PROFILE_DEFINITION.useNotification,
            KIMCHI_REFRIGERATOR_SUB_PROFILE_DEFINITION.customResourcePropertiesHandler,
        );
        this._locationName = locationName;
    }
}

export const KIMCHI_REFRIGERATOR_RESOURCE_MAP: ResourceMap = {
    refrigeration: "refrigeration",
};
export const KIMCHI_REFRIGERATOR_PROFILE_MAP: ProfileMap = {
    refrigeration: {
        oneTouchFilter: "oneTouchFilter",
        freshAirFilter: "freshAirFilter",
    },
};
export const KIMCHI_REFRIGERATOR_LOCATION_MAP: LocationMap = {
    TOP: "top",
    MIDDLE: "middle",
    BOTTOM: "bottom",
    LEFT: "left",
    RIGHT: "right",
    SINGLE: "single",
};
export const KIMCHI_REFRIGERATOR_CUSTOM_PROPERTIES: CustomProperties = [];

type KimchiRefrigeratorPropertyEntry = Record<string, unknown>;
type KimchiRefrigeratorLocationProperties = Record<
    string,
    Record<string, string[]>
>;

const getKimchiRefrigeratorTemperatureEntries = (
    profile: Record<string, DynamicObjectOrStringArray>,
): KimchiRefrigeratorPropertyEntry[] => {
    const temperatureEntries = _.get(profile, "property.temperature", []);
    return Array.isArray(temperatureEntries)
        ? (temperatureEntries as KimchiRefrigeratorPropertyEntry[])
        : [];
};

const getKimchiRefrigeratorLocationName = (
    temperatureProperty: KimchiRefrigeratorPropertyEntry,
): string | undefined => {
    return _.get(temperatureProperty, "locationName") as string | undefined;
};

const initializeKimchiRefrigeratorLocationProfiles = (
    mainProfile: KimchiRefrigeratorProfile,
    profile: Record<string, DynamicObjectOrStringArray>,
): void => {
    const locationProperties: KimchiRefrigeratorLocationProperties = {};
    for (const temperatureProperty of getKimchiRefrigeratorTemperatureEntries(
        profile,
    )) {
        const locationName =
            getKimchiRefrigeratorLocationName(temperatureProperty);
        if (
            !locationName ||
            !(locationName in KIMCHI_REFRIGERATOR_LOCATION_MAP)
        ) {
            continue;
        }
        const attrKey = KIMCHI_REFRIGERATOR_LOCATION_MAP[locationName];
        const subProfile = createKimchiRefrigeratorSubProfile(
            profile,
            locationName,
        );
        mainProfile[attrKey] = subProfile;
        locationProperties[attrKey] = subProfile.properties;
    }
    mainProfile._locationProperties = locationProperties;
};

export class KimchiRefrigeratorProfile extends ConnectDeviceProfile {
    static _RESOURCE_MAP: ResourceMap = KIMCHI_REFRIGERATOR_RESOURCE_MAP;
    static _PROFILE: ProfileMap = KIMCHI_REFRIGERATOR_PROFILE_MAP;
    static _LOCATION_MAP: LocationMap = KIMCHI_REFRIGERATOR_LOCATION_MAP;
    static _CUSTOM_PROPERTIES: CustomProperties =
        KIMCHI_REFRIGERATOR_CUSTOM_PROPERTIES;
    constructor(profile: Record<string, DynamicObjectOrStringArray>) {
        super(
            profile,
            KIMCHI_REFRIGERATOR_RESOURCE_MAP,
            KIMCHI_REFRIGERATOR_PROFILE_MAP,
            KIMCHI_REFRIGERATOR_LOCATION_MAP,
            KIMCHI_REFRIGERATOR_CUSTOM_PROPERTIES,
        );
        initializeKimchiRefrigeratorLocationProfiles(this, profile);
    }
}

export const createKimchiRefrigeratorSubProfile = (
    profile: Record<string, DynamicObjectOrStringArray>,
    locationName: string,
): ConnectDeviceProfile => {
    return new KimchiRefrigeratorSubProfile(profile, locationName);
};

export const createKimchiRefrigeratorProfile = (
    profile: Record<string, DynamicObjectOrStringArray>,
): ConnectDeviceProfile => {
    return new KimchiRefrigeratorProfile(profile);
};

export class KimchiRefrigeratorSubDevice extends ConnectSubDevice {
    constructor(
        profiles: ConnectDeviceProfile,
        locationName: string,
        thinqApi: ThinQApi,
        deviceId: string,
        deviceType: string,
        modelName: string,
        alias: string,
        reportable: boolean,
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
            true,
            undefined,
            energyProfile,
        );
    }

    get profiles(): ConnectDeviceProfile {
        return this._profiles;
    }
}

export class KimchiRefrigeratorDevice extends ConnectMainDevice {
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
            createKimchiRefrigeratorProfile(profile),
            KimchiRefrigeratorSubDevice,
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
