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

export class WaterHeaterProfile extends ConnectDeviceProfile {
    static _RESOURCE_MAP: ResourceMap = {
        waterHeaterJobMode: "waterHeaterJobMode",
        operation: "operation",
        temperatureInUnits: "temperature",
    };
    static _PROFILE: ProfileMap = {
        waterHeaterJobMode: { currentJobMode: "currentJobMode" },
        operation: { waterHeaterOperationMode: "waterHeaterOperationMode" },
        temperatureInUnits: {
            currentTemperatureC: "currentTemperatureC",
            currentTemperatureF: "currentTemperatureF",
            targetTemperatureC: "targetTemperatureC",
            targetTemperatureF: "targetTemperatureF",
            unit: "temperatureUnit",
        },
    };
    static _CUSTOM_PROPERTIES: CustomProperties = ["temperatureInUnits"];
    static _LOCATION_MAP: LocationMap = {};

    constructor(profile: Record<string, any>) {
        super(
            profile,
            WaterHeaterProfile._RESOURCE_MAP,
            WaterHeaterProfile._PROFILE,
            WaterHeaterProfile._LOCATION_MAP,
            WaterHeaterProfile._CUSTOM_PROPERTIES,
        );
    }

    checkAttributeWritable(propAttr: string): boolean {
        return (
            propAttr == "temperatureUnit" ||
            (this._getPropAttr(propAttr)[WRITABILITY] as boolean)
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
        for (const temperatures of resourceProperty as Record<
            string,
            unknown
        >[]) {
            const unit = temperatures["unit"] as string;
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

export class WaterHeaterDevice extends ConnectBaseDevice {
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
            new WaterHeaterProfile(profile),
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
            if (attribute == "temperatureUnit") {
                if (unit == "C") {
                    this._setStatusAttr(attribute, unit);
                }
            } else if (_.toUpper(attribute[attribute.length - 1]) == unit) {
                const temperatureMap =
                    this.profiles._PROFILE["temperatureInUnits"];
                let _attributeValue = null;
                let _propKey = null;
                if (_.includes(_.values(temperatureMap), attribute))
                    _propKey = _.findKey(
                        temperatureMap,
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

    _setTargetTemperature = async (
        temperature: number,
        unit: string,
    ): Promise<ThinQApiResponse | undefined> => {
        return await this.doMultiAttributeCommand({
            [unit === "C" ? "targetTemperatureC" : "targetTemperatureF"]:
                temperature,
            temperatureUnit: unit,
        });
    };

    setTargetTemperatureC = async (
        temperature: number,
    ): Promise<ThinQApiResponse | undefined> => {
        return await this._setTargetTemperature(temperature, "C");
    };

    setTargetTemperatureF = async (
        temperature: number,
    ): Promise<ThinQApiResponse | undefined> => {
        return await this._setTargetTemperature(temperature, "F");
    };
}
