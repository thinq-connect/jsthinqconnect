/*
 * SPDX-FileCopyrightText: Copyright 2025 LG Electronics Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import _ from "lodash";
import {
    ConnectBaseDevice,
    ConnectDeviceProfile,
    ConnectDeviceProfileDefinition,
    createConnectDeviceProfile,
    READABILITY,
    WRITABILITY,
    CustomResourcePropertiesHandler,
    CustomAttributePayloadHandler,
    CustomAttributeWritableHandler,
    CustomStatusResourceHandler,
} from "./ConnectDevice";
import {
    ResourceMap,
    ProfileMap,
    CustomProperties,
    LocationMap,
} from "../types/Resources";
import { DynamicObjectOrStringArray, AttributePayload } from "../types/Devices";
import { ThinQApi, ThinQApiResponse } from "../ThinQAPI";

export const WATER_HEATER_RESOURCE_MAP: ResourceMap = {
    waterHeaterJobMode: "waterHeaterJobMode",
    operation: "operation",
    temperatureInUnits: "temperature",
};

export const WATER_HEATER_PROFILE_MAP: ProfileMap = {
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

export const WATER_HEATER_CUSTOM_PROPERTIES: CustomProperties = [
    "temperatureInUnits",
];
export const WATER_HEATER_LOCATION_MAP: LocationMap = {};

export const waterHeaterCustomResourcePropertiesHandler: CustomResourcePropertiesHandler =
    (resourceKey, resourceProperty, props, profile): [string[], string[]] => {
        const readableProps: string[] = [];
        const writableProps: string[] = [];
        if (!_.includes(WATER_HEATER_CUSTOM_PROPERTIES, resourceKey)) {
            return [readableProps, writableProps];
        }

        const units: string[] = [];
        for (const temperatures of resourceProperty as Record<
            string,
            unknown
        >[]) {
            const unit = temperatures["unit"] as string;
            for (const [propKey, propAttr] of _.toPairs(props)) {
                if (propKey[propKey.length - 1] !== unit) continue;
                const prop = profile._getProperties(
                    temperatures as Record<string, DynamicObjectOrStringArray>,
                    propKey.slice(0, -1),
                );
                if (prop[READABILITY] === true) {
                    readableProps.push(propAttr);
                }
                if (prop[WRITABILITY] === true) {
                    writableProps.push(propAttr);
                }
                profile._setPropAttr(propAttr, prop);
            }
            units.push(unit);
        }

        const propAttr = props["unit"];
        const prop = profile._getReadOnlyEnumProperty(units);
        if (prop[READABILITY] === true) {
            readableProps.push(propAttr);
        }
        if (prop[WRITABILITY] === true) {
            writableProps.push(propAttr);
        }
        profile._setPropAttr(propAttr, prop);

        return [readableProps, writableProps];
    };

export const waterHeaterCustomAttributePayloadHandler: CustomAttributePayloadHandler =
    (attribute, value, profile): AttributePayload | undefined => {
        for (const [resource, props] of _.toPairs(profile.getProfile())) {
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
    };

export const waterHeaterCustomAttributeWritableHandler: CustomAttributeWritableHandler =
    (propAttr, profile): boolean | null => {
        if (propAttr === "temperatureUnit") return true;
        const value = profile._getPropAttr(propAttr)[WRITABILITY];
        return typeof value === "boolean" ? value : null;
    };

export const WATER_HEATER_PROFILE_DEFINITION: ConnectDeviceProfileDefinition = {
    resourceMap: WATER_HEATER_RESOURCE_MAP,
    profileMap: WATER_HEATER_PROFILE_MAP,
    locationMap: WATER_HEATER_LOCATION_MAP,
    customProperties: WATER_HEATER_CUSTOM_PROPERTIES,
    customResourcePropertiesHandler: waterHeaterCustomResourcePropertiesHandler,
    customAttributePayloadHandler: waterHeaterCustomAttributePayloadHandler,
    customAttributeWritableHandler: waterHeaterCustomAttributeWritableHandler,
};

export class WaterHeaterProfile extends ConnectDeviceProfile {
    static _RESOURCE_MAP: ResourceMap = WATER_HEATER_RESOURCE_MAP;
    static _PROFILE: ProfileMap = WATER_HEATER_PROFILE_MAP;
    static _CUSTOM_PROPERTIES: CustomProperties =
        WATER_HEATER_CUSTOM_PROPERTIES;
    static _LOCATION_MAP: LocationMap = WATER_HEATER_LOCATION_MAP;

    constructor(profile: Record<string, DynamicObjectOrStringArray>) {
        super(
            profile,
            WATER_HEATER_PROFILE_DEFINITION.resourceMap,
            WATER_HEATER_PROFILE_DEFINITION.profileMap,
            WATER_HEATER_PROFILE_DEFINITION.locationMap,
            WATER_HEATER_PROFILE_DEFINITION.customProperties,
            WATER_HEATER_PROFILE_DEFINITION.useExtensionProperty,
            WATER_HEATER_PROFILE_DEFINITION.useSubProfileOnly,
            WATER_HEATER_PROFILE_DEFINITION.locationName,
            WATER_HEATER_PROFILE_DEFINITION.useNotification,
            WATER_HEATER_PROFILE_DEFINITION.customResourcePropertiesHandler,
            WATER_HEATER_PROFILE_DEFINITION.customAttributePayloadHandler,
            WATER_HEATER_PROFILE_DEFINITION.customAttributeWritableHandler,
        );
    }
}

export const createWaterHeaterProfile = (
    profile: Record<string, DynamicObjectOrStringArray>,
): ConnectDeviceProfile => {
    return createConnectDeviceProfile(profile, WATER_HEATER_PROFILE_DEFINITION);
};

export const waterHeaterCustomStatusResourceHandler: CustomStatusResourceHandler =
    (propKey, attribute, resourceStatus, isUpdated, device): boolean => {
        for (const temperatureStatus of resourceStatus as Record<
            string,
            unknown
        >[]) {
            const unit = temperatureStatus["unit"];
            if (attribute === "temperatureUnit") {
                if (unit === "C") {
                    device._setStatusAttr(attribute, unit);
                }
            } else if (_.toUpper(attribute[attribute.length - 1]) === unit) {
                const temperatureMap =
                    device.profiles._PROFILE["temperatureInUnits"];
                let attributeValue = null;
                let statusPropKey = null;
                if (_.includes(_.values(temperatureMap), attribute)) {
                    statusPropKey = _.findKey(
                        temperatureMap,
                        (value) => value === attribute,
                    );
                }

                if (!statusPropKey) {
                    attributeValue = null;
                } else if (
                    !(statusPropKey.slice(0, -1) in temperatureStatus) &&
                    isUpdated
                ) {
                    continue;
                } else {
                    attributeValue = _.get(
                        temperatureStatus,
                        statusPropKey.slice(0, -1),
                    );
                }
                device._setStatusAttr(attribute, attributeValue);
            }
        }
        return true;
    };

export class WaterHeaterDevice extends ConnectBaseDevice {
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
            createWaterHeaterProfile(profile),
            undefined,
            undefined,
            energyProfile,
            waterHeaterCustomStatusResourceHandler,
        );
    }

    get profiles(): ConnectDeviceProfile {
        return this._profiles;
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
