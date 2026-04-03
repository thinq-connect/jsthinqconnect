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
} from "./ConnectDevice.js";
import {
    ResourceMap,
    ProfileMap,
    CustomProperties,
    LocationMap,
} from "../types/Resources.js";
import {
    DynamicObjectOrObjectArray,
    DynamicObjectOrStringArray,
    AttributePayload,
} from "../types/Devices.js";
import { ThinQApi, ThinQApiResponse } from "../ThinQAPI";

export const WINE_CELLAR_RESOURCE_MAP: ResourceMap = { operation: "operation" };
export const WINE_CELLAR_PROFILE_MAP: ProfileMap = {
    operation: {
        lightBrightness: "lightBrightness",
        optimalHumidity: "optimalHumidity",
        sabbathMode: "sabbathMode",
        lightStatus: "lightStatus",
    },
};
export const WINE_CELLAR_LOCATION_MAP: LocationMap = {
    WINE_UPPER: "upper",
    WINE_MIDDLE: "middle",
    WINE_LOWER: "lower",
};
export const WINE_CELLAR_CUSTOM_PROPERTIES: CustomProperties = [
    "temperatureInUnits",
];

type WineCellarPropertyEntry = Record<string, unknown>;
type WineCellarLocationProperties = Record<string, Record<string, string[]>>;

const getWineCellarTemperatureEntries = (
    profile: Record<string, DynamicObjectOrStringArray>,
): WineCellarPropertyEntry[] => {
    const temperatureEntries = _.get(
        profile,
        "property.temperatureInUnits",
        [],
    );
    return Array.isArray(temperatureEntries)
        ? (temperatureEntries as WineCellarPropertyEntry[])
        : [];
};

const getWineCellarLocationName = (
    locationProperty: WineCellarPropertyEntry,
): string | undefined => {
    return _.get(locationProperty, "locationName") as string | undefined;
};

const initializeWineCellarLocationProfiles = (
    mainProfile: WineCellarProfile,
    profile: Record<string, DynamicObjectOrStringArray>,
): void => {
    const locationProperties: WineCellarLocationProperties = {};
    for (const locationProperty of getWineCellarTemperatureEntries(profile)) {
        const locationName = getWineCellarLocationName(locationProperty);
        if (!locationName || !(locationName in WINE_CELLAR_LOCATION_MAP)) {
            continue;
        }
        const attrKey = WINE_CELLAR_LOCATION_MAP[locationName];
        const subProfile = createWineCellarSubProfile(profile, locationName);
        mainProfile[attrKey] = subProfile;
        locationProperties[attrKey] = subProfile.properties;
    }
    mainProfile._locationProperties = locationProperties;
};

export class WineCellarProfile extends ConnectDeviceProfile {
    static _RESOURCE_MAP: ResourceMap = WINE_CELLAR_RESOURCE_MAP;
    static _PROFILE: ProfileMap = WINE_CELLAR_PROFILE_MAP;
    static _LOCATION_MAP: LocationMap = WINE_CELLAR_LOCATION_MAP;
    static _CUSTOM_PROPERTIES: CustomProperties = WINE_CELLAR_CUSTOM_PROPERTIES;
    constructor(profile: Record<string, DynamicObjectOrStringArray>) {
        super(
            profile,
            WINE_CELLAR_RESOURCE_MAP,
            WINE_CELLAR_PROFILE_MAP,
            WINE_CELLAR_LOCATION_MAP,
            WINE_CELLAR_CUSTOM_PROPERTIES,
        );
        initializeWineCellarLocationProfiles(this, profile);
    }
}

export const WINE_CELLAR_SUB_RESOURCE_MAP: ResourceMap = {
    temperatureInUnits: "temperature",
};

export const WINE_CELLAR_SUB_PROFILE_MAP: ProfileMap = {
    temperatureInUnits: {
        targetTemperatureC: "targetTemperatureC",
        targetTemperatureF: "targetTemperatureF",
        unit: "temperatureUnit",
    },
};
export const WINE_CELLAR_SUB_LOCATION_MAP: LocationMap = {};
export const WINE_CELLAR_SUB_CUSTOM_PROPERTIES: CustomProperties = [
    "temperatureInUnits",
];

export const wineCellarSubCustomResourcePropertiesHandler: CustomResourcePropertiesHandler =
    (_resourceKey, resourceProperty, props, profile): [string[], string[]] => {
        const readableProps: string[] = [];
        const writableProps: string[] = [];
        for (const locationProperty of resourceProperty as Record<
            string,
            unknown
        >[]) {
            if (locationProperty["locationName"] !== profile._locationName) {
                continue;
            }
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

export const WINE_CELLAR_SUB_PROFILE_DEFINITION: ConnectDeviceProfileDefinition =
    {
        resourceMap: WINE_CELLAR_SUB_RESOURCE_MAP,
        profileMap: WINE_CELLAR_SUB_PROFILE_MAP,
        locationMap: WINE_CELLAR_SUB_LOCATION_MAP,
        customProperties: WINE_CELLAR_SUB_CUSTOM_PROPERTIES,
        customResourcePropertiesHandler:
            wineCellarSubCustomResourcePropertiesHandler,
        useNotification: false,
    };

class WineCellarSubProfile extends ConnectDeviceProfile {
    static _RESOURCE_MAP: ResourceMap = WINE_CELLAR_SUB_RESOURCE_MAP;
    static _PROFILE: ProfileMap = WINE_CELLAR_SUB_PROFILE_MAP;
    static _LOCATION_MAP: LocationMap = WINE_CELLAR_SUB_LOCATION_MAP;
    static _CUSTOM_PROPERTIES: CustomProperties =
        WINE_CELLAR_SUB_CUSTOM_PROPERTIES;

    constructor(
        profile: Record<string, DynamicObjectOrStringArray>,
        locationName: string,
    ) {
        super(
            profile,
            WINE_CELLAR_SUB_PROFILE_DEFINITION.resourceMap,
            WINE_CELLAR_SUB_PROFILE_DEFINITION.profileMap,
            WINE_CELLAR_SUB_PROFILE_DEFINITION.locationMap,
            WINE_CELLAR_SUB_PROFILE_DEFINITION.customProperties,
            false,
            false,
            locationName,
            WINE_CELLAR_SUB_PROFILE_DEFINITION.useNotification,
            WINE_CELLAR_SUB_PROFILE_DEFINITION.customResourcePropertiesHandler,
        );
        this._locationName = locationName;
    }
}

export const createWineCellarSubProfile = (
    profile: Record<string, DynamicObjectOrStringArray>,
    locationName: string,
): ConnectDeviceProfile => {
    return new WineCellarSubProfile(profile, locationName);
};

export const createWineCellarProfile = (
    profile: Record<string, DynamicObjectOrStringArray>,
): ConnectDeviceProfile => {
    return new WineCellarProfile(profile);
};

export class WineCellarSubDevice extends ConnectSubDevice {
    constructor(
        profiles: ConnectDeviceProfile,
        locationName: string,
        thinqApi: ThinQApi,
        deviceId: string,
        deviceType: string,
        modelName: string,
        alias: string,
        reportable: boolean,
        singleUnit = true,
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

export class WineCellarDevice extends ConnectMainDevice {
    constructor(
        thinqApi: ThinQApi,
        deviceId: string,
        deviceType: string,
        modelName: string,
        alias: string,
        reportable: boolean,
        profile: Record<string, DynamicObjectOrStringArray>,
    ) {
        super(
            thinqApi,
            deviceId,
            deviceType,
            modelName,
            alias,
            reportable,
            createWineCellarProfile(profile),
            WineCellarSubDevice,
        );
    }

    get profiles(): ConnectDeviceProfile {
        return this._profiles;
    }

    getSubDevice(locationName: string): ConnectSubDevice | null {
        return super.getSubDevice(locationName) as ConnectSubDevice | null;
    }

    setLightBrightness = async (
        brightnessInput: string,
    ): Promise<ThinQApiResponse | undefined> => {
        return await this.doEnumAttributeCommand(
            "lightBrightness",
            brightnessInput,
        );
    };

    setOptimalHumidity = async (
        humidityInput: string,
    ): Promise<ThinQApiResponse | undefined> => {
        return await this.doEnumAttributeCommand(
            "optimalHumidity",
            humidityInput,
        );
    };

    setLightStatus = async (
        lightStatusInput: number,
    ): Promise<ThinQApiResponse | undefined> => {
        return await this.doRangeAttributeCommand(
            "lightStatus",
            lightStatusInput,
        );
    };
}
