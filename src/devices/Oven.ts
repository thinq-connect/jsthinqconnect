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
    LocationMap,
    CustomProperties,
} from "../types/Resources";
import {
    DynamicObjectOrObjectArray,
    DynamicObjectOrStringArray,
    AttributePayload,
} from "../types/Devices";
import { ThinQApi, ThinQApiResponse } from "../ThinQAPI";

export class OvenProfile extends ConnectDeviceProfile {
    static _RESOURCE_MAP: ResourceMap = { info: "info" };
    static _PROFILE: ProfileMap = { info: { type: "ovenType" } };
    static _LOCATION_MAP: LocationMap = {
        OVEN: "oven",
        UPPER: "upper",
        LOWER: "lower",
    };
    static _CUSTOM_PROPERTIES: CustomProperties = [];

    constructor(profile: Record<string, any>) {
        super(
            profile,
            OvenProfile._RESOURCE_MAP,
            OvenProfile._PROFILE,
            OvenProfile._LOCATION_MAP,
            OvenProfile._CUSTOM_PROPERTIES,
            true,
            false,
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
            if (locationName in OvenProfile._LOCATION_MAP) {
                const attrKey = OvenProfile._LOCATION_MAP[locationName];
                const _subProfile = new OvenSubProfile(profile, locationName);
                this[attrKey] = _subProfile;
                _locationProperties[attrKey] = _subProfile.properties;
            }
        }
        this._locationProperties = _locationProperties;
    }
}

export class OvenSubProfile extends ConnectDeviceProfile {
    static _RESOURCE_MAP: ResourceMap = {
        runState: "runState",
        operation: "operation",
        cook: "cook",
        remoteControlEnable: "remoteControlEnable",
        temperature: "temperature",
        timer: "timer",
    };

    static _PROFILE: ProfileMap = {
        runState: { currentState: "currentState" },
        operation: { ovenOperationMode: "ovenOperationMode" },
        cook: { cookMode: "cookMode" },
        remoteControlEnable: { remoteControlEnabled: "remoteControlEnabled" },
        temperature: {
            C: "targetTemperatureC",
            F: "targetTemperatureF",
            unit: "temperatureUnit",
        },
        timer: {
            remainHour: "remainHour",
            remainMinute: "remainMinute",
            remainSecond: "remainSecond",
            targetHour: "targetHour",
            targetMinute: "targetMinute",
            targetSecond: "targetSecond",
            timerHour: "timerHour",
            timerMinute: "timerMinute",
            timerSecond: "timerSecond",
        },
    };

    static _CUSTOM_PROPERTIES: CustomProperties = ["temperature"];
    static _LocationMap: LocationMap = {};

    constructor(profile: Record<string, any>, locationName: string) {
        super(
            profile,
            OvenSubProfile._RESOURCE_MAP,
            OvenSubProfile._PROFILE,
            OvenSubProfile._LocationMap,
            OvenSubProfile._CUSTOM_PROPERTIES,
            false,
            false,
            locationName,
            false,
        );
        this._locationName = locationName;
    }

    getRangeAttributePayload = (
        attribute: string,
        value: number,
    ): AttributePayload | undefined => {
        const temperatureInfo = this._getPropAttr(attribute);
        if (!this.checkRangeAttributeWritable(attribute, value))
            new Error(`Not support ${attribute}`);
        return {
            location: { locationName: this._locationName },
            temperature: {
                targetTemperature: value,
                unit: temperatureInfo["unit"] as string,
            },
        };
    };

    _generateCustomResourceProperties(
        resourceKey: string,
        resourceProperty: Record<string, unknown>[],
        props: Record<string, string>,
    ): [string[], string[]] {
        const readableProps: string[] = [];
        const writableProps: string[] = [];

        if (resourceKey !== "temperature") {
            return [readableProps, writableProps];
        }
        const temperatureMap = this._PROFILE[resourceKey];
        const units = [];
        for (const _temperature of resourceProperty) {
            const _temperatureUnit = _.get(_temperature, "unit") as string;
            if (_temperatureUnit in temperatureMap) {
                const attrName = temperatureMap[_temperatureUnit];
                const prop = this._getProperties(
                    _temperature as Record<string, DynamicObjectOrStringArray>,
                    "targetTemperature",
                );
                this._setPropAttr(attrName, prop);
                if (prop[READABILITY]) readableProps.push(attrName);
                if (prop[WRITABILITY]) writableProps.push(attrName);
                units.push(_temperatureUnit);
            }
        }
        const propAttr = _.get(props, "unit", "");
        const prop = this._getReadOnlyEnumProperty(units);
        if (prop[READABILITY]) readableProps.push(propAttr);
        if (prop[WRITABILITY]) writableProps.push(propAttr);
        this._setPropAttr(propAttr, prop);

        return [readableProps, writableProps];
    }

    generateProperties(property: Record<string, unknown>[]): void {
        for (const locationProperty of property) {
            if (
                _.get(locationProperty, "location.locationName") !==
                this._locationName
            ) {
                continue;
            }
            super.generateProperties(locationProperty);
        }
    }
}

export class OvenSubDevice extends ConnectSubDevice {
    static _CUSTOM_SET_PROPERTY_NAME = {
        targetHour: "targetTime",
        targetMinute: "targetTime",
        timerHour: "timer",
        timerMinute: "timer",
    };

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
            false,
            OvenSubDevice._CUSTOM_SET_PROPERTY_NAME,
            energyProfile,
        );
        this._tempUnit = null;
    }

    get profiles(): ConnectDeviceProfile {
        return this._profiles;
    }

    get remainTime(): Record<string, number> {
        return {
            hour: this.getStatus("remainHour") as number,
            minute: this.getStatus("remainMinute") as number,
            second: this.getStatus("remainSecond") as number,
        };
    }

    get targetTime(): Record<string, number> {
        return {
            hour: this.getStatus("targetHour") as number,
            minute: this.getStatus("targetMinute") as number,
            second: this.getStatus("targetSecond") as number,
        };
    }

    get timerTime(): Record<string, number> {
        return {
            hour: this.getStatus("timerHour") as number,
            minute: this.getStatus("timerMinute") as number,
            second: this.getStatus("timerSecond") as number,
        };
    }

    _setCustomResources(
        propKey: string,
        attribute: string,
        resourceStatus: DynamicObjectOrObjectArray,
        isUpdated = false,
    ): boolean {
        if (attribute == "temperatureUnit") {
            return true;
        }
        const temperatureMap = this.profiles._PROFILE["temperature"];
        const _tempStatusValue = _.get(resourceStatus, "targetTemperature");
        const _tempStatusUnit = _.get(resourceStatus, "unit", "") as string;

        if (!_tempStatusUnit) {
            this._setStatusAttr(
                _.get(temperatureMap, this._tempUnit),
                _tempStatusValue,
            );
            return true;
        }

        let _attributeValue = null;
        const _tempAttrName = _.get(temperatureMap, _tempStatusUnit);
        if (attribute == _tempAttrName) {
            this._tempUnit = _tempStatusUnit;
            this._setStatusAttr("temperatureUnit", _tempStatusUnit);
            _attributeValue = _tempStatusValue;
        } else if (isUpdated) {
            return true;
        }
        this._setStatusAttr(attribute, _attributeValue);
        return true;
    }

    setOvenOperationMode = async (
        mode: string,
    ): Promise<ThinQApiResponse | undefined> => {
        const payload: Record<string, unknown> | undefined =
            this.profiles.getEnumAttributePayload("ovenOperationMode", mode);
        if (payload)
            return await this._doAttributeCommand({
                location: { locationName: this._locationName },
                ...payload,
            });
    };

    setCookMode = async (
        mode: string,
    ): Promise<ThinQApiResponse | undefined> => {
        const payload: Record<string, unknown> | undefined =
            this.profiles.getEnumAttributePayload("ovenOperationMode", "START");
        const cookModePayload: Record<string, unknown> | undefined =
            this.profiles.getEnumAttributePayload("cookMode", mode);
        if (cookModePayload)
            return await this._doAttributeCommand({
                location: { locationName: this._locationName },
                ...payload,
                ...cookModePayload,
            });
    };

    setCookModeWithTemperatureF = async (
        mode: string,
        targetTemperature: number,
    ): Promise<ThinQApiResponse | undefined> => {
        return await this._setTargetTemperature(targetTemperature, "F", mode);
    };

    setCookModeWithTemperatureC = async (
        mode: string,
        targetTemperature: number,
    ): Promise<ThinQApiResponse | undefined> => {
        return await this._setTargetTemperature(targetTemperature, "C", mode);
    };

    _setTargetTemperature = async (
        targetTemperature: number,
        unit: string,
        mode: string | undefined = undefined,
    ): Promise<ThinQApiResponse> => {
        const payload = this.profiles.getEnumAttributePayload(
            "ovenOperationMode",
            "START",
        );
        const cookModePayload: Record<string, unknown> | undefined = mode
            ? this.profiles.getEnumAttributePayload("cookMode", mode)
            : {};
        const temperatureMap = this.profiles._PROFILE["temperature"];
        const temperaturePayload: Record<string, unknown> | undefined =
            this.profiles.getRangeAttributePayload(
                _.get(temperatureMap, unit),
                targetTemperature,
            );
        return await this._doAttributeCommand({
            location: { locationName: this._locationName },
            ...payload,
            ...cookModePayload,
            ...temperaturePayload,
        });
    };

    setTargetTemperatureF = async (
        temperature: number,
    ): Promise<ThinQApiResponse> => {
        return await this._setTargetTemperature(temperature, "F");
    };

    setTargetTemperatureC = async (
        temperature: number,
    ): Promise<ThinQApiResponse> => {
        return await this._setTargetTemperature(temperature, "C");
    };

    setTargetTime = async (
        targetHour: number,
        targetMinute: number,
    ): Promise<ThinQApiResponse | undefined> => {
        const payload = this.profiles.getEnumAttributePayload(
            "ovenOperationMode",
            "START",
        );
        const targetTimePayload = this.profiles.getAttributePayload(
            "targetHour",
            targetHour,
        ) as AttributePayload;
        const targetMinutePayload = this.profiles.getAttributePayload(
            "targetMinute",
            targetMinute,
        );
        for (const key in targetMinutePayload) {
            if (
                Object.prototype.hasOwnProperty.call(targetMinutePayload, key)
            ) {
                targetTimePayload[key] = {
                    ...targetTimePayload[key],
                    ...targetMinutePayload[key],
                };
            }
        }
        if (payload)
            return await this._doAttributeCommand({
                location: { locationName: this._locationName },
                ...payload,
                ...targetTimePayload,
            });
    };

    setTimer = async (
        hour: number,
        minute: number,
    ): Promise<ThinQApiResponse> => {
        return await this.doMultiAttributeCommand({
            timerHour: hour,
            timerMinute: minute,
        });
    };
}

export class OvenDevice extends ConnectMainDevice {
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
            new OvenProfile(profile),
            OvenSubDevice,
            energyProfile,
        );
        this.ovenType = (
            _.get(this.profiles.getProperty("ovenType"), "r", [
                null,
            ]) as string[]
        )[0];
    }

    get profiles(): ConnectDeviceProfile {
        return this._profiles;
    }

    getSubDevice(locationName: string): ConnectSubDevice | null {
        return super.getSubDevice(locationName);
    }
}
