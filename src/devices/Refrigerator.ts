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
    CustomProperties,
    LocationMap,
} from "../types/Resources";
import {
    DynamicObjectOrObjectArray,
    DynamicObjectOrStringArray,
    AttributePayload,
} from "../types/Devices";
import { ThinQApi, ThinQApiResponse } from "../ThinQAPI";

export const REFRIGERATOR_SUB_RESOURCE_MAP: ResourceMap = {
    doorStatus: "doorStatus",
    temperatureInUnits: "temperature",
};

export const REFRIGERATOR_SUB_PROFILE_MAP: ProfileMap = {
    doorStatus: { doorState: "doorState" },
    temperatureInUnits: {
        targetTemperatureC: "targetTemperatureC",
        targetTemperatureF: "targetTemperatureF",
        unit: "temperatureUnit",
    },
};
export const REFRIGERATOR_SUB_CUSTOM_PROPERTIES: CustomProperties = [
    "doorStatus",
    "temperatureInUnits",
];
export const REFRIGERATOR_SUB_LOCATION_MAP: LocationMap = {};

export const refrigeratorSubCustomResourcePropertiesHandler: CustomResourcePropertiesHandler =
    (resourceKey, resourceProperty, props, profile): [string[], string[]] => {
        const readableProps: string[] = [];
        const writableProps: string[] = [];

        if (!(resourceKey in REFRIGERATOR_SUB_PROFILE_MAP)) {
            return [readableProps, writableProps];
        }
        for (const locationProperty of resourceProperty as Record<
            string,
            unknown
        >[]) {
            if (locationProperty["locationName"] !== profile._locationName)
                continue;

            for (const [propKey, propAttr] of _.toPairs(props)) {
                const prop = profile._getProperties(
                    locationProperty as Record<
                        string,
                        DynamicObjectOrStringArray
                    >,
                    propKey,
                );
                delete prop["unit"];
                if (prop[READABILITY]) readableProps.push(`${propAttr}`);
                if (prop[WRITABILITY]) writableProps.push(`${propAttr}`);
                profile._setPropAttr(propAttr, prop);
            }
        }
        return [readableProps, writableProps];
    };

export const REFRIGERATOR_SUB_PROFILE_DEFINITION: ConnectDeviceProfileDefinition =
    {
        resourceMap: REFRIGERATOR_SUB_RESOURCE_MAP,
        profileMap: REFRIGERATOR_SUB_PROFILE_MAP,
        locationMap: REFRIGERATOR_SUB_LOCATION_MAP,
        customProperties: REFRIGERATOR_SUB_CUSTOM_PROPERTIES,
        customResourcePropertiesHandler:
            refrigeratorSubCustomResourcePropertiesHandler,
        useNotification: false,
    };

export class RefrigeratorSubProfile extends ConnectDeviceProfile {
    static _RESOURCE_MAP: ResourceMap = REFRIGERATOR_SUB_RESOURCE_MAP;
    static _PROFILE: ProfileMap = REFRIGERATOR_SUB_PROFILE_MAP;
    static _CUSTOM_PROPERTIES: CustomProperties =
        REFRIGERATOR_SUB_CUSTOM_PROPERTIES;
    static _LOCATION_MAP: LocationMap = REFRIGERATOR_SUB_LOCATION_MAP;

    constructor(
        profile: Record<string, DynamicObjectOrStringArray>,
        locationName: string,
    ) {
        super(
            profile,
            REFRIGERATOR_SUB_PROFILE_DEFINITION.resourceMap,
            REFRIGERATOR_SUB_PROFILE_DEFINITION.profileMap,
            REFRIGERATOR_SUB_PROFILE_DEFINITION.locationMap,
            REFRIGERATOR_SUB_PROFILE_DEFINITION.customProperties,
            false,
            false,
            locationName,
            REFRIGERATOR_SUB_PROFILE_DEFINITION.useNotification,
            REFRIGERATOR_SUB_PROFILE_DEFINITION.customResourcePropertiesHandler,
        );
        this._locationName = locationName;
    }
}

export const REFRIGERATOR_RESOURCE_MAP: ResourceMap = {
    powerSave: "powerSave",
    ecoFriendly: "ecoFriendly",
    sabbath: "sabbath",
    refrigeration: "refrigeration",
    waterFilterInfo: "waterFilterInfo",
};
export const REFRIGERATOR_PROFILE_MAP: ProfileMap = {
    powerSave: { powerSaveEnabled: "powerSaveEnabled" },
    ecoFriendly: { ecoFriendlyMode: "ecoFriendlyMode" },
    sabbath: { sabbathMode: "sabbathMode" },
    refrigeration: {
        rapidFreeze: "rapidFreeze",
        expressMode: "expressMode",
        expressModeName: "expressModeName",
        expressFridge: "expressFridge",
        freshAirFilter: "freshAirFilter",
        freshAirFilterRemainPercent: "freshAirFilterRemainPercent",
    },
    waterFilterInfo: {
        usedTime: "usedTime",
        unit: "waterFilterInfoUnit",
        waterFilterState: "waterFilterState",
        waterFilter1RemainPercent: "waterFilter1RemainPercent",
        waterFilter2RemainPercent: "waterFilter2RemainPercent",
        waterFilter3RemainPercent: "waterFilter3RemainPercent",
    },
};
export const REFRIGERATOR_LOCATION_MAP: LocationMap = {};
export const REFRIGERATOR_CUSTOM_PROPERTIES: CustomProperties = [];

type RefrigeratorPropertyEntry = Record<string, unknown>;
type RefrigeratorLocationProperties = Record<string, Record<string, string[]>>;

const getRefrigeratorPropertyEntries = (
    profile: Record<string, DynamicObjectOrStringArray>,
    path: string,
): RefrigeratorPropertyEntry[] => {
    const propertyEntries = _.get(profile, path, []);
    return Array.isArray(propertyEntries)
        ? (propertyEntries as RefrigeratorPropertyEntry[])
        : [];
};

const getRefrigeratorLocationName = (
    locationProperty: RefrigeratorPropertyEntry,
): string | undefined => {
    return _.get(locationProperty, "locationName") as string | undefined;
};

const appendRefrigeratorLocationProfiles = (
    locationProperties: RefrigeratorLocationProperties,
    mainProfile: RefrigeratorProfile,
    profile: Record<string, DynamicObjectOrStringArray>,
    propertyPath: string,
    locationMap: LocationMap,
): void => {
    for (const locationProperty of getRefrigeratorPropertyEntries(
        profile,
        propertyPath,
    )) {
        const locationName = getRefrigeratorLocationName(locationProperty);
        if (!locationName || !(locationName in locationMap)) {
            continue;
        }
        const attrKey = locationMap[locationName];
        const subProfile = createRefrigeratorSubProfile(profile, locationName);
        mainProfile[attrKey] = subProfile;
        locationProperties[attrKey] = subProfile.properties;
    }
};

const initializeRefrigeratorLocationProfiles = (
    mainProfile: RefrigeratorProfile,
    profile: Record<string, DynamicObjectOrStringArray>,
): void => {
    const locationProperties: RefrigeratorLocationProperties = {};
    appendRefrigeratorLocationProfiles(
        locationProperties,
        mainProfile,
        profile,
        "property.doorStatus",
        RefrigeratorProfile._DOOR_LOCATION_MAP,
    );
    appendRefrigeratorLocationProfiles(
        locationProperties,
        mainProfile,
        profile,
        "property.temperatureInUnits",
        RefrigeratorProfile._TEMPERATURE_LOCATION_MAP,
    );
    mainProfile._locationProperties = locationProperties;
};

export class RefrigeratorProfile extends ConnectDeviceProfile {
    static _RESOURCE_MAP: ResourceMap = REFRIGERATOR_RESOURCE_MAP;
    static _PROFILE: ProfileMap = REFRIGERATOR_PROFILE_MAP;
    static _LOCATION_MAP: LocationMap = REFRIGERATOR_LOCATION_MAP;
    static _CUSTOM_PROPERTIES: CustomProperties =
        REFRIGERATOR_CUSTOM_PROPERTIES;

    static _DOOR_LOCATION_MAP: LocationMap = { MAIN: "main" };
    static _TEMPERATURE_LOCATION_MAP: LocationMap = {
        FRIDGE: "fridge",
        FREEZER: "freezer",
        CONVERTIBLE: "convertible",
    };

    constructor(profile: Record<string, DynamicObjectOrStringArray>) {
        super(
            profile,
            REFRIGERATOR_RESOURCE_MAP,
            REFRIGERATOR_PROFILE_MAP,
            REFRIGERATOR_LOCATION_MAP,
            REFRIGERATOR_CUSTOM_PROPERTIES,
        );
        initializeRefrigeratorLocationProfiles(this, profile);
    }

    getLocationKey(locationName: string): string | undefined {
        for (const [key, name] of _.toPairs(
            RefrigeratorProfile._DOOR_LOCATION_MAP,
        )) {
            if (name === locationName) return key;
        }
        for (const [key, name] of _.toPairs(
            RefrigeratorProfile._TEMPERATURE_LOCATION_MAP,
        )) {
            if (name === locationName) return key;
        }
    }
}

export const createRefrigeratorSubProfile = (
    profile: Record<string, DynamicObjectOrStringArray>,
    locationName: string,
): ConnectDeviceProfile => {
    return new RefrigeratorSubProfile(profile, locationName);
};

export const createRefrigeratorProfile = (
    profile: Record<string, DynamicObjectOrStringArray>,
): ConnectDeviceProfile => {
    return new RefrigeratorProfile(profile);
};

export class RefrigeratorSubDevice extends ConnectSubDevice {
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

    _setCustomResources(
        propKey: string,
        attribute: string,
        resourceStatus: DynamicObjectOrObjectArray,
        isUpdated?: boolean,
    ): boolean {
        if (
            isUpdated &&
            _.includes(["targetTemperatureC", "targetTemperatureF"], attribute)
        ) {
            const currentUnit =
                _.get(resourceStatus, "unit") ||
                this.getStatus("temperatureUnit");
            if (_.toUpper(attribute[attribute.length - 1]) == currentUnit) {
                this._setStatusAttr(attribute, _.get(resourceStatus, propKey));
            }
            return true;
        }
        return false;
    }

    async _setTargetTemperature(
        temperature: number,
        unit: string,
    ): Promise<ThinQApiResponse | undefined> {
        const _resourceKey = "temperatureInUnits";
        const _targetTemperatureKey = this.getPropertyKey(
            _resourceKey,
            "targetTemperature" + unit,
        ) as string;
        const _payload = this.profiles.getRangeAttributePayload(
            _targetTemperatureKey,
            temperature,
        ) as AttributePayload;
        _payload[_resourceKey] = {
            locationName: this._locationName,
            unit: unit,
            ..._payload[_resourceKey],
        };
        return await this._doAttributeCommand(_payload);
    }

    async setTargetTemperatureC(
        temperature: number,
    ): Promise<ThinQApiResponse | undefined> {
        return await this._setTargetTemperature(temperature, "C");
    }

    async setTargetTemperatureF(
        temperature: number,
    ): Promise<ThinQApiResponse | undefined> {
        return await this._setTargetTemperature(temperature, "F");
    }
}

export class RefrigeratorDevice extends ConnectMainDevice {
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
            createRefrigeratorProfile(profile),
            RefrigeratorSubDevice,
            energyProfile,
        );
    }

    get profiles(): ConnectDeviceProfile {
        return this._profiles;
    }

    getSubDevice(locationName: string): ConnectSubDevice | null {
        return super.getSubDevice(locationName) as ConnectSubDevice | null;
    }

    setRapidFreeze = async (
        mode: boolean,
    ): Promise<ThinQApiResponse | undefined> => {
        return await this.doAttributeCommand("rapidFreeze", mode);
    };

    setExpressMode = async (
        mode: boolean,
    ): Promise<ThinQApiResponse | undefined> => {
        return await this.doAttributeCommand("expressMode", mode);
    };

    setExpressFridge = async (
        mode: boolean,
    ): Promise<ThinQApiResponse | undefined> => {
        return await this.doAttributeCommand("expressFridge", mode);
    };

    setFreshAirFilter = async (
        mode: string,
    ): Promise<ThinQApiResponse | undefined> => {
        return await this.doEnumAttributeCommand("freshAirFilter", mode);
    };
}
