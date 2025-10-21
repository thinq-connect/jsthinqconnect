/*
 * SPDX-FileCopyrightText: Copyright 2025 LG Electronics Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import _ from "lodash";
import {
    ConnectMainDevice,
    ConnectSubDevice,
    ConnectDeviceProfile,
    READABILITY,
    WRITABILITY,
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

export class RefrigeratorSubProfile extends ConnectDeviceProfile {
    static _RESOURCE_MAP: ResourceMap = {
        doorStatus: "doorStatus",
        temperatureInUnits: "temperature",
    };

    static _PROFILE: ProfileMap = {
        doorStatus: { doorState: "doorState" },
        temperatureInUnits: {
            targetTemperatureC: "targetTemperatureC",
            targetTemperatureF: "targetTemperatureF",
            unit: "temperatureUnit",
        },
    };
    static _CUSTOM_PROPERTIES: CustomProperties = [
        "doorStatus",
        "temperatureInUnits",
    ];
    static _LOCATION_MAP: LocationMap = {};

    constructor(profile: Record<string, any>, locationName: string) {
        super(
            profile,
            RefrigeratorSubProfile._RESOURCE_MAP,
            RefrigeratorSubProfile._PROFILE,
            RefrigeratorSubProfile._LOCATION_MAP,
            RefrigeratorSubProfile._CUSTOM_PROPERTIES,
            false,
            false,
            locationName,
            false,
        );
        this._locationName = locationName;
    }

    _generateCustomResourceProperties(
        resourceKey: string,
        resourceProperty: Record<string, unknown>[],
        props: Record<string, string>,
    ): [string[], string[]] {
        const readableProps: string[] = [];
        const writableProps: string[] = [];

        if (!(resourceKey in RefrigeratorSubProfile._PROFILE)) {
            return [readableProps, writableProps];
        }
        for (const _locationProperty of resourceProperty) {
            if (_locationProperty["locationName"] !== this._locationName)
                continue;

            for (const [propKey, propAttr] of _.toPairs(props)) {
                const prop = this._getProperties(
                    _locationProperty as Record<
                        string,
                        DynamicObjectOrStringArray
                    >,
                    propKey,
                );
                delete prop["unit"];
                if (prop[READABILITY]) readableProps.push(`${propAttr}`);
                if (prop[WRITABILITY]) writableProps.push(`${propAttr}`);
                this._setPropAttr(propAttr, prop);
            }
        }
        return [readableProps, writableProps];
    }
}

export class RefrigeratorProfile extends ConnectDeviceProfile {
    static _RESOURCE_MAP: ResourceMap = {
        powerSave: "powerSave",
        ecoFriendly: "ecoFriendly",
        sabbath: "sabbath",
        refrigeration: "refrigeration",
        waterFilterInfo: "waterFilterInfo",
    };
    static _PROFILE: ProfileMap = {
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
    static _LOCATION_MAP: LocationMap = {};
    static _CUSTOM_PROPERTIES: CustomProperties = [];

    static _DOOR_LOCATION_MAP: LocationMap = { MAIN: "main" };
    static _TEMPERATURE_LOCATION_MAP: LocationMap = {
        FRIDGE: "fridge",
        FREEZER: "freezer",
        CONVERTIBLE: "convertible",
    };

    constructor(profile: Record<string, any>) {
        super(
            profile,
            RefrigeratorProfile._RESOURCE_MAP,
            RefrigeratorProfile._PROFILE,
            RefrigeratorProfile._LOCATION_MAP,
            RefrigeratorProfile._CUSTOM_PROPERTIES,
        );
        const _locationProperties: Record<
            string,
            Record<string, string[]>
        > = {};
        for (const locationProperty of _.get(
            profile,
            "property.doorStatus",
            [],
        )) {
            const locationName = _.get(locationProperty, "locationName");
            if (locationName in RefrigeratorProfile._DOOR_LOCATION_MAP) {
                const attrKey =
                    RefrigeratorProfile._DOOR_LOCATION_MAP[locationName];
                const _subProfile = new RefrigeratorSubProfile(
                    profile,
                    locationName,
                );
                this[attrKey] = _subProfile;
                _locationProperties[attrKey] = _subProfile.properties;
            }
        }
        for (const locationProperty of _.get(
            profile,
            "property.temperatureInUnits",
            [],
        )) {
            const locationName = _.get(locationProperty, "locationName");
            if (locationName in RefrigeratorProfile._TEMPERATURE_LOCATION_MAP) {
                const attrKey =
                    RefrigeratorProfile._TEMPERATURE_LOCATION_MAP[locationName];
                const _subProfile = new RefrigeratorSubProfile(
                    profile,
                    locationName,
                );
                this[attrKey] = _subProfile;
                _locationProperties[attrKey] = _subProfile.properties;
            }
        }
        this._locationProperties = _locationProperties;
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
            new RefrigeratorProfile(profile),
            RefrigeratorSubDevice,
            energyProfile,
        );
    }

    get profiles(): ConnectDeviceProfile {
        return this._profiles;
    }

    getSubDevice(locationName: string): ConnectSubDevice | null {
        return super.getSubDevice(locationName);
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
