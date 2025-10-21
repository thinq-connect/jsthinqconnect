/*
 * SPDX-FileCopyrightText: Copyright 2025 LG Electronics Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import _ from "lodash";
import {
    ConnectBaseDevice,
    ConnectDeviceProfile,
    READABILITY,
    WRITABILITY,
} from "./ConnectDevice";
import {
    ResourceMap,
    ProfileMap,
    CustomProperties,
    LocationMap,
    CustomPropertyMappingTable,
} from "../types/Resources";
import {
    DynamicObjectOrObjectArray,
    DynamicObjectOrStringArray,
    AttributePayload,
} from "../types/Devices";
import { ThinQApi, ThinQApiResponse } from "../ThinQAPI";

export class AirConditionerProfile extends ConnectDeviceProfile {
    static _RESOURCE_MAP: ResourceMap = {
        airConJobMode: "airConJobMode",
        operation: "operation",
        temperatureInUnits: "temperature",
        twoSetTemperature: "twoSetTemperature",
        twoSetTemperatureInUnits: "twoSetTemperature",
        timer: "timer",
        sleepTimer: "sleepTimer",
        powerSave: "powerSave",
        airFlow: "airFlow",
        airQualitySensor: "airQualitySensor",
        filterInfo: "filterInfo",
        display: "display",
        windDirection: "windDirection",
    };
    static _PROFILE: ProfileMap = {
        airConJobMode: { currentJobMode: "currentJobMode" },
        operation: {
            airConOperationMode: "airConOperationMode",
            airCleanOperationMode: "airCleanOperationMode",
        },
        temperatureInUnits: {
            currentTemperatureC: "currentTemperatureC",
            currentTemperatureF: "currentTemperatureF",
            targetTemperatureC: "targetTemperatureC",
            targetTemperatureF: "targetTemperatureF",
            minTargetTemperatureC: "minTargetTemperatureC",
            minTargetTemperatureF: "minTargetTemperatureF",
            maxTargetTemperatureC: "maxTargetTemperatureC",
            maxTargetTemperatureF: "maxTargetTemperatureF",
            heatTargetTemperatureC: "heatTargetTemperatureC",
            heatTargetTemperatureF: "heatTargetTemperatureF",
            coolTargetTemperatureC: "coolTargetTemperatureC",
            coolTargetTemperatureF: "coolTargetTemperatureF",
            autoTargetTemperatureC: "autoTargetTemperatureC",
            autoTargetTemperatureF: "autoTargetTemperatureF",
            unit: "temperatureUnit",
        },
        twoSetTemperature: {
            twoSetEnabled: "twoSetEnabled",
        },
        twoSetTemperatureInUnits: {
            heatTargetTemperatureC: "twoSetHeatTargetTemperatureC",
            heatTargetTemperatureF: "twoSetHeatTargetTemperatureF",
            coolTargetTemperatureC: "twoSetCoolTargetTemperatureC",
            coolTargetTemperatureF: "twoSetCoolTargetTemperatureF",
            unit: "twoSetTemperatureUnit",
        },
        timer: {
            relativeHourToStart: "relativeHourToStart",
            relativeMinuteToStart: "relativeMinuteToStart",
            relativeHourToStop: "relativeHourToStop",
            relativeMinuteToStop: "relativeMinuteToStop",
            absoluteHourToStart: "absoluteHourToStart",
            absoluteMinuteToStart: "absoluteMinuteToStart",
            absoluteHourToStop: "absoluteHourToStop",
            absoluteMinuteToStop: "absoluteMinuteToStop",
        },
        sleepTimer: {
            relativeHourToStop: "sleepTimerRelativeHourToStop",
            relativeMinuteToStop: "sleepTimerRelativeMinuteToStop",
        },
        powerSave: { powerSaveEnabled: "powerSaveEnabled" },
        airFlow: { windStrength: "windStrength", windStep: "windStep" },
        airQualitySensor: {
            PM1: "pm1",
            PM2: "pm2",
            PM10: "pm10",
            odor: "odor",
            odorLevel: "odorLevel",
            humidity: "humidity",
            totalPollution: "totalPollution",
            totalPollutionLevel: "totalPollutionLevel",
            monitoringEnabled: "monitoringEnabled",
        },
        filterInfo: {
            usedTime: "usedTime",
            filterLifetime: "filterLifetime",
            filterRemainPercent: "filterRemainPercent",
        },
        display: { light: "displayLight" },
        windDirection: {
            rotateUpDown: "windRotateUpDown",
            rotateLeftRight: "windRotateLeftRight",
        },
    };
    static _CUSTOM_PROPERTIES: CustomProperties = [
        "twoSetTemperature",
        "temperatureInUnits",
        "twoSetTemperatureInUnits",
    ];
    static _LOCATION_MAP: LocationMap = {};

    static _CUSTOM_PROPERTY_MAPPING_TABLE: CustomPropertyMappingTable = {
        currentTemperatureC: "currentTemperature",
        currentTemperatureF: "currentTemperature",
        targetTemperatureC: "targetTemperature",
        targetTemperatureF: "targetTemperature",
        heatTargetTemperatureC: "heatTargetTemperature",
        heatTargetTemperatureF: "heatTargetTemperature",
        coolTargetTemperatureC: "coolTargetTemperature",
        coolTargetTemperatureF: "coolTargetTemperature",
        minTargetTemperatureC: "minTargetTemperature",
        minTargetTemperatureF: "minTargetTemperature",
        maxTargetTemperatureC: "maxTargetTemperature",
        maxTargetTemperatureF: "maxTargetTemperature",
        autoTargetTemperatureC: "autoTargetTemperature",
        autoTargetTemperatureF: "autoTargetTemperature",
        twoSetHeatTargetTemperatureC: "heatTargetTemperature",
        twoSetHeatTargetTemperatureF: "heatTargetTemperature",
        twoSetCoolTargetTemperatureC: "coolTargetTemperature",
        twoSetCoolTargetTemperatureF: "coolTargetTemperature",
    };

    constructor(profile: Record<string, any>) {
        super(
            profile,
            AirConditionerProfile._RESOURCE_MAP,
            AirConditionerProfile._PROFILE,
            AirConditionerProfile._LOCATION_MAP,
            AirConditionerProfile._CUSTOM_PROPERTIES,
        );
    }

    checkAttributeWritable(propAttr: string): boolean {
        return (
            _.includes(
                ["temperatureUnit", "twoSetTemperatureUnit"],
                propAttr,
            ) || (this._getPropAttr(propAttr)[WRITABILITY] as boolean)
        );
    }

    _getAttributePayload(
        attribute: string,
        value: string | number | boolean,
    ): AttributePayload | undefined {
        for (const [resource, props] of _.toPairs(this._PROFILE)) {
            for (const [propKey, propAttr] of _.toPairs(props)) {
                if (propAttr === attribute) {
                    return !_.has(
                        AirConditionerProfile._CUSTOM_PROPERTY_MAPPING_TABLE,
                        attribute,
                    )
                        ? {
                              [resource]: {
                                  [propKey]: value,
                              },
                          }
                        : {
                              [resource]: {
                                  [AirConditionerProfile
                                      ._CUSTOM_PROPERTY_MAPPING_TABLE[
                                      attribute
                                  ]]: value,
                              },
                          };
                }
            }
        }
    }
    _generateCustomResourceProperties(
        resourceKey: string,
        resourceProperty: DynamicObjectOrObjectArray,
        props: Record<string, string>,
    ): [string[], string[]] {
        const readableProps: string[] = [];
        const writableProps: string[] = [];
        if (!_.includes(this._CUSTOM_PROPERTIES, resourceKey)) {
            return [readableProps, writableProps];
        }

        if (resourceKey == "twoSetTemperature") {
            for (const [propKey, propAttr] of _.toPairs(props)) {
                const prop = this._getProperties(
                    resourceProperty as Record<
                        string,
                        DynamicObjectOrStringArray
                    >,
                    propKey,
                );
                if (prop[READABILITY] === true) {
                    readableProps.push(propAttr);
                }
                if (prop[WRITABILITY] === true) {
                    writableProps.push(propAttr);
                }
                this._setPropAttr(propAttr, prop);
            }
            return [readableProps, writableProps];
        }

        const units: string[] = [];
        const temperatureArray = Array.isArray(resourceProperty)
            ? resourceProperty
            : [resourceProperty];

        for (const temperatures of temperatureArray) {
            const unit = String(temperatures["unit"]);
            for (const [propKey, propAttr] of _.toPairs(props)) {
                if (propKey[propKey.length - 1] != unit) continue;
                const prop = this._getProperties(
                    temperatures as Record<string, DynamicObjectOrStringArray>,
                    propKey.slice(0, -1),
                );
                if (prop[READABILITY] === true) {
                    readableProps.push(propAttr);
                }
                if (prop[WRITABILITY] === true) {
                    writableProps.push(propAttr);
                }
                this._setPropAttr(propAttr, prop);
            }
            units.push(unit);
        }

        const propAttr = props["unit"];
        const prop = this._getReadOnlyEnumProperty(units);
        if (prop[READABILITY] === true) {
            readableProps.push(propAttr);
        }
        if (prop[WRITABILITY] === true) {
            writableProps.push(propAttr);
        }
        this._setPropAttr(propAttr, prop);

        return [readableProps, writableProps];
    }
}

export class AirConditionerDevice extends ConnectBaseDevice {
    static _CUSTOM_SET_PROPERTY_NAME = {
        relativeHourToStart: "relativeTimeToStart",
        relativeMinuteToStart: "relativeTimeToStart",
        relativeHourToStop: "relativeTimeToStop",
        relativeMinuteToStop: "relativeTimeToStop",
        absoluteHourToStart: "absoluteTimeToStart",
        absoluteMinuteToStart: "absoluteTimeToStart",
        absoluteHourToStop: "absoluteTimeToStop",
        absoluteMinuteToStop: "absoluteTimeToStop",
        sleepTimerRelativeHourToStop: "sleepTimerRelativeTimeToStop",
        sleepTimerRelativeMinuteToStop: "sleepTimerRelativeTimeToStop",
    };

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
            new AirConditionerProfile(profile),
            AirConditionerDevice._CUSTOM_SET_PROPERTY_NAME,
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
        isUpdated = false,
    ): boolean {
        if (attribute == "twoSetEnabled") return false;
        for (const temperatureStatus of resourceStatus as Record<
            string,
            unknown
        >[]) {
            const unit = temperatureStatus["unit"];
            if (
                _.includes(
                    ["temperatureUnit", "twoSetTemperatureUnit"],
                    attribute,
                )
            ) {
                const _attributeValue = unit;
                if (unit == "C")
                    this._setStatusAttr(attribute, _attributeValue);
            } else if (attribute[attribute.length - 1] == unit) {
                const temperatureMap =
                    this.profiles._PROFILE["temperatureInUnits"];
                const twoSetTemperatureMap =
                    this.profiles._PROFILE["twoSetTemperatureInUnits"];

                let _attributeValue = null;
                let _propKey = null;
                if (_.includes(_.values(temperatureMap), attribute))
                    _propKey = _.findKey(
                        temperatureMap,
                        (value) => value === attribute,
                    );
                else if (_.includes(_.values(twoSetTemperatureMap), attribute))
                    _propKey = _.findKey(
                        twoSetTemperatureMap,
                        (value) => value === attribute,
                    );

                if (!_propKey) _attributeValue = null;
                else if (
                    !(_propKey.slice(0, -1) in temperatureStatus) &&
                    isUpdated
                )
                    continue;
                else
                    _attributeValue = _.get(
                        temperatureStatus,
                        _propKey.slice(0, -1),
                    );
                this._setStatusAttr(attribute, _attributeValue);
            }
        }
        return true;
    }

    setCurrentJobMode = async (
        mode: string,
    ): Promise<ThinQApiResponse | undefined> => {
        return await this.doEnumAttributeCommand("currentJobMode", mode);
    };

    setAirConOperationMode = async (
        mode: string,
    ): Promise<ThinQApiResponse | undefined> => {
        return await this.doEnumAttributeCommand("airConOperationMode", mode);
    };

    setAirCleanOperationMode = async (
        operation: string,
    ): Promise<ThinQApiResponse | undefined> => {
        return await this.doEnumAttributeCommand(
            "airCleanOperationMode",
            operation,
        );
    };

    _setHeatTargetTemperature = async (
        temperature: number,
        unit: string,
    ): Promise<ThinQApiResponse | undefined> => {
        return await this.doMultiAttributeCommand({
            [unit == "C" ? "heatTargetTemperatureC" : "heatTargetTemperatureF"]:
                temperature,
            temperatureUnit: unit,
        });
    };

    setHeatTargetTemperatureC = async (
        temperature: number,
    ): Promise<ThinQApiResponse | undefined> => {
        return this._setHeatTargetTemperature(temperature, "C");
    };

    setHeatTargetTemperatureF = async (
        temperature: number,
    ): Promise<ThinQApiResponse | undefined> => {
        return this._setHeatTargetTemperature(temperature, "F");
    };

    _setCoolTargetTemperature = async (
        temperature: number,
        unit: string,
    ): Promise<ThinQApiResponse | undefined> => {
        return await this.doMultiAttributeCommand({
            [unit == "C" ? "coolTargetTemperatureC" : "coolTargetTemperatureF"]:
                temperature,
            temperatureUnit: unit,
        });
    };

    setCoolTargetTemperatureC = async (
        temperature: number,
    ): Promise<ThinQApiResponse | undefined> => {
        return this._setCoolTargetTemperature(temperature, "C");
    };

    setCoolTargetTemperatureF = async (
        temperature: number,
    ): Promise<ThinQApiResponse | undefined> => {
        return this._setCoolTargetTemperature(temperature, "F");
    };

    _setTwoSetHeatTargetTemperature = async (
        temperature: number,
        unit: string,
    ): Promise<ThinQApiResponse | undefined> => {
        const coolTargetProp =
            unit == "C"
                ? "twoSetCoolTargetTemperatureC"
                : "twoSetCoolTargetTemperatureF";
        return await this.doMultiAttributeCommand({
            [unit == "C"
                ? "twoSetHeatTargetTemperatureC"
                : "twoSetHeatTargetTemperatureF"]: temperature,
            [coolTargetProp]: this.getStatus(coolTargetProp),
            twoSetTemperatureUnit: unit,
        });
    };

    _setTwoSetCoolTargetTemperature = async (
        temperature: number,
        unit: string,
    ): Promise<ThinQApiResponse | undefined> => {
        const heatTargetProp =
            unit == "C"
                ? "twoSetHeatTargetTemperatureC"
                : "twoSetHeatTargetTemperatureF";
        return await this.doMultiAttributeCommand({
            [unit == "C"
                ? "twoSetCoolTargetTemperatureC"
                : "twoSetCoolTargetTemperatureF"]: temperature,
            [heatTargetProp]: this.getStatus(heatTargetProp),
            twoSetTemperatureUnit: unit,
        });
    };

    setTwoSetHeatTargetTemperatureC = async (
        temperature: number,
    ): Promise<ThinQApiResponse | undefined> => {
        return this._setTwoSetHeatTargetTemperature(temperature, "C");
    };

    setTwoSetHeatTargetTemperatureF = async (
        temperature: number,
    ): Promise<ThinQApiResponse | undefined> => {
        return this._setTwoSetHeatTargetTemperature(temperature, "F");
    };

    setTwoSetCoolTargetTemperatureC = async (
        temperature: number,
    ): Promise<ThinQApiResponse | undefined> => {
        return this._setTwoSetCoolTargetTemperature(temperature, "C");
    };

    setTwoSetCoolTargetTemperatureF = async (
        temperature: number,
    ): Promise<ThinQApiResponse | undefined> => {
        return this._setTwoSetCoolTargetTemperature(temperature, "F");
    };

    _setTwoSetHeatCoolTargetTemperature = async (
        heatTemperature: number,
        coolTemperature: number,
        unit: string,
    ): Promise<ThinQApiResponse | undefined> => {
        const heatTargetProp =
            unit == "C"
                ? "twoSetHeatTargetTemperatureC"
                : "twoSetHeatTargetTemperatureF";
        const coolTargetProp =
            unit == "C"
                ? "twoSetCoolTargetTemperatureC"
                : "twoSetCoolTargetTemperatureF";
        return await this.doMultiAttributeCommand({
            [heatTargetProp]: heatTemperature,
            [coolTargetProp]: coolTemperature,
            twoSetTemperatureUnit: unit,
        });
    };

    setTwoSetHeatCoolTargetTemperatureC = async (
        heatTemperature: number,
        coolTemperature: number,
    ): Promise<ThinQApiResponse | undefined> => {
        return this._setTwoSetHeatCoolTargetTemperature(
            heatTemperature,
            coolTemperature,
            "C",
        );
    };

    setTwoSetHeatCoolTargetTemperatureF = async (
        heatTemperature: number,
        coolTemperature: number,
    ): Promise<ThinQApiResponse | undefined> => {
        return this._setTwoSetHeatCoolTargetTemperature(
            heatTemperature,
            coolTemperature,
            "F",
        );
    };

    _setMinTargetTemperature = async (
        temperature: number,
        unit: string,
    ): Promise<ThinQApiResponse | undefined> => {
        return await this.doMultiAttributeCommand({
            [unit == "C" ? "minTargetTemperatureC" : "minTargetTemperatureF"]:
                temperature,
            temperatureUnit: unit,
        });
    };

    setMinTargetTemperatureC = async (
        temperature: number,
    ): Promise<ThinQApiResponse | undefined> => {
        return this._setMinTargetTemperature(temperature, "C");
    };

    setMinTargetTemperatureF = async (
        temperature: number,
    ): Promise<ThinQApiResponse | undefined> => {
        return this._setMinTargetTemperature(temperature, "F");
    };

    _setMaxTargetTemperature = async (
        temperature: number,
        unit: string,
    ): Promise<ThinQApiResponse | undefined> => {
        return await this.doMultiAttributeCommand({
            [unit == "C" ? "maxTargetTemperatureC" : "maxTargetTemperatureF"]:
                temperature,
            temperatureUnit: unit,
        });
    };

    setMaxTargetTemperatureC = async (
        temperature: number,
    ): Promise<ThinQApiResponse | undefined> => {
        return this._setMaxTargetTemperature(temperature, "C");
    };

    setMaxTargetTemperatureF = async (
        temperature: number,
    ): Promise<ThinQApiResponse | undefined> => {
        return this._setMaxTargetTemperature(temperature, "F");
    };

    _setAutoTargetTemperature = async (
        temperature: number,
        unit: string,
    ): Promise<ThinQApiResponse | undefined> => {
        return await this.doMultiAttributeCommand({
            [unit == "C" ? "autoTargetTemperatureC" : "autoTargetTemperatureF"]:
                temperature,
            temperatureUnit: unit,
        });
    };

    setAutoTargetTemperatureC = async (
        temperature: number,
    ): Promise<ThinQApiResponse | undefined> => {
        return this._setAutoTargetTemperature(temperature, "C");
    };

    setAutoTargetTemperatureF = async (
        temperature: number,
    ): Promise<ThinQApiResponse | undefined> => {
        return this._setAutoTargetTemperature(temperature, "F");
    };

    setRelativeTimeToStart = async (
        hour: number,
        minute: number,
    ): Promise<ThinQApiResponse> => {
        return await this.doMultiAttributeCommand({
            relativeHourToStart: hour,
            relativeMinuteToStart: minute,
        });
    };

    setRelativeTimeToStop = async (
        hour: number,
        minute: number,
    ): Promise<ThinQApiResponse> => {
        return await this.doMultiAttributeCommand({
            relativeHourToStop: hour,
            relativeMinuteToStop: minute,
        });
    };

    setAbsoluteTimeToStart = async (
        hour: number,
        minute: number,
    ): Promise<ThinQApiResponse> => {
        return await this.doMultiAttributeCommand({
            absoluteHourToStart: hour,
            absoluteMinuteToStart: minute,
        });
    };

    setAbsoluteTimeToStop = async (
        hour: number,
        minute: number,
    ): Promise<ThinQApiResponse> => {
        return await this.doMultiAttributeCommand({
            absoluteHourToStop: hour,
            absoluteMinuteToStop: minute,
        });
    };

    setSleepTimerRelativeTimeToStop = async (
        hour: number,
        minute: number,
    ): Promise<ThinQApiResponse> => {
        return await this.doMultiAttributeCommand({
            sleepTimerRelativeHourToStop: hour,
            ...(minute !== 0 ? { sleepTimerRelativeMinuteToStop: minute } : {}),
        });
    };

    setPowerSaveEnabled = async (
        enabled: boolean,
    ): Promise<ThinQApiResponse | undefined> => {
        return await this.doAttributeCommand("powerSaveEnabled", enabled);
    };

    setWindStrength = async (
        strength: string,
    ): Promise<ThinQApiResponse | undefined> => {
        return await this.doEnumAttributeCommand("windStrength", strength);
    };

    setWindStep = async (
        step: number,
    ): Promise<ThinQApiResponse | undefined> => {
        return await this.doRangeAttributeCommand("windStep", step);
    };

    setMonitoringEnabled = async (
        enabled: string,
    ): Promise<ThinQApiResponse | undefined> => {
        return await this.doEnumAttributeCommand("monitoringEnabled", enabled);
    };

    setDisplayLight = async (
        displayLight: string,
    ): Promise<ThinQApiResponse | undefined> => {
        return await this.doEnumAttributeCommand("displayLight", displayLight);
    };

    setWindRotateUpDown = async (
        windRotateUpDown: boolean,
    ): Promise<ThinQApiResponse | undefined> => {
        return await this.doAttributeCommand(
            "windRotateUpDown",
            windRotateUpDown,
        );
    };

    setWindRotateLeftRight = async (
        windRotateLeftRight: boolean,
    ): Promise<ThinQApiResponse | undefined> => {
        return await this.doAttributeCommand(
            "windRotateLeftRight",
            windRotateLeftRight,
        );
    };
}
