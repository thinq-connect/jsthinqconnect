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
} from "../types/Resources";
import {
    DynamicObjectOrObjectArray,
    DynamicObjectOrStringArray,
    AttributePayload,
} from "../types/Devices";
import { ThinQApi, ThinQApiResponse } from "../ThinQAPI";

export class SystemBoilerProfile extends ConnectDeviceProfile {
    static _RESOURCE_MAP: ResourceMap = {
        boilerJobMode: "boilerJobMode",
        operation: "operation",
        hotWaterTemperatureInUnits: "hotWaterTemperature",
        roomTemperatureInUnits: "roomTemperature",
    };
    static _PROFILE: ProfileMap = {
        boilerJobMode: { currentJobMode: "currentJobMode" },
        operation: {
            boilerOperationMode: "boilerOperationMode",
            hotWaterMode: "hotWaterMode",
            roomTempMode: "roomTempMode",
            roomWaterMode: "roomWaterMode",
        },
        hotWaterTemperatureInUnits: {
            currentTemperatureC: "hotWaterCurrentTemperatureC",
            currentTemperatureF: "hotWaterCurrentTemperatureF",
            targetTemperatureC: "hotWaterTargetTemperatureC",
            targetTemperatureF: "hotWaterTargetTemperatureF",
            maxTemperatureC: "hotWaterMaxTemperatureC",
            maxTemperatureF: "hotWaterMaxTemperatureF",
            minTemperatureC: "hotWaterMinTemperatureC",
            minTemperatureF: "hotWaterMinTemperatureF",
            unit: "hotWaterTemperatureUnit",
        },
        roomTemperatureInUnits: {
            currentTemperatureC: "roomCurrentTemperatureC",
            currentTemperatureF: "roomCurrentTemperatureF",
            airCurrentTemperatureC: "roomAirCurrentTemperatureC",
            airCurrentTemperatureF: "roomAirCurrentTemperatureF",
            outWaterCurrentTemperatureC: "roomOutWaterCurrentTemperatureC",
            outWaterCurrentTemperatureF: "roomOutWaterCurrentTemperatureF",
            inWaterCurrentTemperatureC: "roomInWaterCurrentTemperatureC",
            inWaterCurrentTemperatureF: "roomInWaterCurrentTemperatureF",
            targetTemperatureC: "roomTargetTemperatureC",
            targetTemperatureF: "roomTargetTemperatureF",
            airCoolTargetTemperatureC: "roomAirCoolTargetTemperatureC",
            airCoolTargetTemperatureF: "roomAirCoolTargetTemperatureF",
            airHeatTargetTemperatureC: "roomAirHeatTargetTemperatureC",
            airHeatTargetTemperatureF: "roomAirHeatTargetTemperatureF",
            waterCoolTargetTemperatureC: "roomWaterCoolTargetTemperatureC",
            waterCoolTargetTemperatureF: "roomWaterCoolTargetTemperatureF",
            waterHeatTargetTemperatureC: "roomWaterHeatTargetTemperatureC",
            waterHeatTargetTemperatureF: "roomWaterHeatTargetTemperatureF",
            airHeatMaxTemperatureC: "roomAirHeatMaxTemperatureC",
            airHeatMaxTemperatureF: "roomAirHeatMaxTemperatureF",
            airHeatMinTemperatureC: "roomAirHeatMinTemperatureC",
            airHeatMinTemperatureF: "roomAirHeatMinTemperatureF",
            airCoolMaxTemperatureC: "roomAirCoolMaxTemperatureC",
            airCoolMaxTemperatureF: "roomAirCoolMaxTemperatureF",
            airCoolMinTemperatureC: "roomAirCoolMinTemperatureC",
            airCoolMinTemperatureF: "roomAirCoolMinTemperatureF",
            waterHeatMaxTemperatureC: "roomWaterHeatMaxTemperatureC",
            waterHeatMaxTemperatureF: "roomWaterHeatMaxTemperatureF",
            waterHeatMinTemperatureC: "roomWaterHeatMinTemperatureC",
            waterHeatMinTemperatureF: "roomWaterHeatMinTemperatureF",
            waterCoolMaxTemperatureC: "roomWaterCoolMaxTemperatureC",
            waterCoolMaxTemperatureF: "roomWaterCoolMaxTemperatureF",
            waterCoolMinTemperatureC: "roomWaterCoolMinTemperatureC",
            waterCoolMinTemperatureF: "roomWaterCoolMinTemperatureF",
            unit: "roomTemperatureUnit",
        },
    };
    static _CUSTOM_PROPERTIES: CustomProperties = [
        "hotWaterTemperatureInUnits",
        "roomTemperatureInUnits",
    ];
    static _LOCATION_MAP: LocationMap = {};

    checkAttributeWritable(propAttr: string): boolean {
        return (
            _.includes(
                ["hotWaterTemperatureUnit", "roomTemperatureUnit"],
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
                    return !_.includes(["C", "F"], propKey[propKey.length - 1])
                        ? {
                              [resource]: {
                                  [propKey]: value,
                              },
                          }
                        : {
                              [resource]: {
                                  [propKey.slice(0, -1)]: value,
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

    constructor(profile: Record<string, any>) {
        super(
            profile,
            SystemBoilerProfile._RESOURCE_MAP,
            SystemBoilerProfile._PROFILE,
            SystemBoilerProfile._LOCATION_MAP,
            SystemBoilerProfile._CUSTOM_PROPERTIES,
        );
    }
}

export class SystemBoilerDevice extends ConnectBaseDevice {
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
            new SystemBoilerProfile(profile),
            undefined,
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
        for (const temperatureStatus of resourceStatus as Record<
            string,
            unknown
        >[]) {
            const unit = temperatureStatus["unit"];
            if (
                _.includes(
                    ["hotWaterTemperatureUnit", "roomTemperatureUnit"],
                    attribute,
                )
            ) {
                if (unit == "C") {
                    this._setStatusAttr(attribute, unit);
                }
            } else if (_.toUpper(attribute[attribute.length - 1]) == unit) {
                let _attributeValue = null;
                let _propKey = null;
                for (const temperatureMap of [
                    this.profiles._PROFILE["hotWaterTemperatureInUnits"],
                    this.profiles._PROFILE["roomTemperatureInUnits"],
                ]) {
                    if (_.includes(_.values(temperatureMap), attribute)) {
                        _propKey = _.findKey(
                            temperatureMap,
                            (value) => value === attribute,
                        );
                        break;
                    }
                }

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
                        null,
                    );
                this._setStatusAttr(attribute, _attributeValue);
            }
        }
        return true;
    }

    setBoilerOperationMode = async (
        mode: string,
    ): Promise<ThinQApiResponse | undefined> => {
        return await this.doEnumAttributeCommand("boilerOperationMode", mode);
    };

    setCurrentJobMode = async (
        mode: string,
    ): Promise<ThinQApiResponse | undefined> => {
        return await this.doEnumAttributeCommand("currentJobMode", mode);
    };

    setHotWaterMode = async (
        mode: string,
    ): Promise<ThinQApiResponse | undefined> => {
        return await this.doEnumAttributeCommand("hotWaterMode", mode);
    };

    _setHotWaterTargetTemperature = async (
        temperature: number,
        unit: string,
    ): Promise<ThinQApiResponse | undefined> => {
        const propertyMap: Record<string, string> = {
            C: "hotWaterTargetTemperatureC",
            F: "hotWaterTargetTemperatureF",
        };
        return await this.doMultiAttributeCommand({
            [propertyMap[unit]]: temperature,
            hotWaterTemperatureUnit: unit,
        });
    };

    setHotWaterTargetTemperatureC = async (
        temperature: number,
    ): Promise<ThinQApiResponse | undefined> => {
        return this._setHotWaterTargetTemperature(temperature, "C");
    };

    setHotWaterTargetTemperatureF = async (
        temperature: number,
    ): Promise<ThinQApiResponse | undefined> => {
        return this._setHotWaterTargetTemperature(temperature, "F");
    };

    _setRoomAirCoolTargetTemperature = async (
        temperature: number,
        unit: string,
    ): Promise<ThinQApiResponse | undefined> => {
        const propertyMap: Record<string, string> = {
            C: "roomAirCoolTargetTemperatureC",
            F: "roomAirCoolTargetTemperatureF",
        };
        return await this.doMultiAttributeCommand({
            [propertyMap[unit]]: temperature,
            roomTemperatureUnit: unit,
        });
    };

    setRoomAirCoolTargetTemperatureC = async (
        temperature: number,
    ): Promise<ThinQApiResponse | undefined> => {
        return this._setRoomAirCoolTargetTemperature(temperature, "C");
    };

    setRoomAirCoolTargetTemperatureF = async (
        temperature: number,
    ): Promise<ThinQApiResponse | undefined> => {
        return this._setRoomAirCoolTargetTemperature(temperature, "F");
    };

    _setRoomAirHeatTargetTemperature = async (
        temperature: number,
        unit: string,
    ): Promise<ThinQApiResponse | undefined> => {
        const propertyMap: Record<string, string> = {
            C: "roomAirHeatTargetTemperatureC",
            F: "roomAirHeatTargetTemperatureF",
        };
        return await this.doMultiAttributeCommand({
            [propertyMap[unit]]: temperature,
            roomTemperatureUnit: unit,
        });
    };

    setRoomAirHeatTargetTemperatureC = async (
        temperature: number,
    ): Promise<ThinQApiResponse | undefined> => {
        return this._setRoomAirHeatTargetTemperature(temperature, "C");
    };

    setRoomAirHeatTargetTemperatureF = async (
        temperature: number,
    ): Promise<ThinQApiResponse | undefined> => {
        return this._setRoomAirHeatTargetTemperature(temperature, "F");
    };

    _setRoomWaterCoolTargetTemperature = async (
        temperature: number,
        unit: string,
    ): Promise<ThinQApiResponse | undefined> => {
        const propertyMap: Record<string, string> = {
            C: "roomWaterCoolTargetTemperatureC",
            F: "roomWaterCoolTargetTemperatureF",
        };
        return await this.doMultiAttributeCommand({
            [propertyMap[unit]]: temperature,
            roomTemperatureUnit: unit,
        });
    };

    setRoomWaterCoolTargetTemperatureC = async (
        temperature: number,
    ): Promise<ThinQApiResponse | undefined> => {
        return this._setRoomWaterCoolTargetTemperature(temperature, "C");
    };

    setRoomWaterCoolTargetTemperatureF = async (
        temperature: number,
    ): Promise<ThinQApiResponse | undefined> => {
        return this._setRoomWaterCoolTargetTemperature(temperature, "F");
    };

    _setRoomWaterHeatTargetTemperature = async (
        temperature: number,
        unit: string,
    ): Promise<ThinQApiResponse | undefined> => {
        const propertyMap: Record<string, string> = {
            C: "roomWaterHeatTargetTemperatureC",
            F: "roomWaterHeatTargetTemperatureF",
        };
        return await this.doMultiAttributeCommand({
            [propertyMap[unit]]: temperature,
            roomTemperatureUnit: unit,
        });
    };

    setRoomWaterHeatTargetTemperatureC = async (
        temperature: number,
    ): Promise<ThinQApiResponse | undefined> => {
        return this._setRoomWaterHeatTargetTemperature(temperature, "C");
    };

    setRoomWaterHeatTargetTemperatureF = async (
        temperature: number,
    ): Promise<ThinQApiResponse | undefined> => {
        return this._setRoomWaterHeatTargetTemperature(temperature, "F");
    };
}
