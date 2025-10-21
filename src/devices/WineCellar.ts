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

export class WineCellarProfile extends ConnectDeviceProfile {
    static _RESOURCE_MAP: ResourceMap = { operation: "operation" };
    static _PROFILE: ProfileMap = {
        operation: {
            lightBrightness: "lightBrightness",
            optimalHumidity: "optimalHumidity",
            sabbathMode: "sabbathMode",
            lightStatus: "lightStatus",
        },
    };
    static _LOCATION_MAP: LocationMap = {
        WINE_UPPER: "upper",
        WINE_MIDDLE: "middle",
        WINE_LOWER: "lower",
    };
    static _CUSTOM_PROPERTIES: CustomProperties = ["temperatureInUnits"];
    constructor(profile: Record<string, any>) {
        super(
            profile,
            WineCellarProfile._RESOURCE_MAP,
            WineCellarProfile._PROFILE,
            WineCellarProfile._LOCATION_MAP,
            WineCellarProfile._CUSTOM_PROPERTIES,
        );
        const _locationProperties: Record<
            string,
            Record<string, string[]>
        > = {};
        for (const locationProperty of _.get(
            profile,
            "property.temperatureInUnits",
            [],
        )) {
            const locationName = _.get(locationProperty, "locationName");
            if (locationName in WineCellarProfile._LOCATION_MAP) {
                const attrKey = WineCellarProfile._LOCATION_MAP[locationName];
                const _subProfile = new WineCellarSubProfile(
                    profile,
                    locationName,
                );
                this[attrKey] = _subProfile;
                _locationProperties[attrKey] = _subProfile.properties;
            }
        }
        this._locationProperties = _locationProperties;
    }
}

class WineCellarSubProfile extends ConnectDeviceProfile {
    static _RESOURCE_MAP: ResourceMap = { temperatureInUnits: "temperature" };

    static _PROFILE: ProfileMap = {
        temperatureInUnits: {
            targetTemperatureC: "targetTemperatureC",
            targetTemperatureF: "targetTemperatureF",
            unit: "temperatureUnit",
        },
    };
    static _LOCATION_MAP: LocationMap = {};
    static _CUSTOM_PROPERTIES: CustomProperties = ["temperatureInUnits"];

    constructor(profile: Record<string, any>, locationName: string) {
        super(
            profile,
            WineCellarSubProfile._RESOURCE_MAP,
            WineCellarSubProfile._PROFILE,
            WineCellarSubProfile._LOCATION_MAP,
            WineCellarSubProfile._CUSTOM_PROPERTIES,
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
        if (!_.includes(_.keys(this._PROFILE), resourceKey)) {
            return [readableProps, writableProps];
        }
        for (const _locationProperty of resourceProperty) {
            if (_locationProperty["locationName"] !== this._locationName) {
                continue;
            }
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
        profile: Record<string, any>,
    ) {
        super(
            thinqApi,
            deviceId,
            deviceType,
            modelName,
            alias,
            reportable,
            new WineCellarProfile(profile),
            WineCellarSubDevice,
        );
    }

    get profiles(): ConnectDeviceProfile {
        return this._profiles;
    }

    getSubDevice(locationName: string): ConnectSubDevice | null {
        return super.getSubDevice(locationName);
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
