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
} from "./ConnectDevice";
import {
    ResourceMap,
    ProfileMap,
    CustomProperties,
    LocationMap,
} from "../types/Resources";
import { DynamicObjectOrStringArray } from "../types/Devices";
import { ThinQApi, ThinQApiResponse } from "../ThinQAPI";

export const VENTILATOR_RESOURCE_MAP: ResourceMap = {
    ventJobMode: "ventilatorJobMode",
    operation: "operation",
    temperature: "temperature",
    airQualitySensor: "airQualitySensor",
    airFlow: "airFlow",
    timer: "timer",
    sleepTimer: "sleepTimer",
};

export const VENTILATOR_PROFILE_MAP: ProfileMap = {
    ventJobMode: { currentJobMode: "currentJobMode" },
    operation: { ventOperationMode: "ventilatorOperationMode" },
    temperature: {
        currentTemperature: "currentTemperature",
        unit: "temperatureUnit",
    },
    airQualitySensor: {
        PM1: "pm1",
        PM2: "pm2",
        PM10: "pm10",
        CO2: "co2",
    },
    airFlow: { windStrength: "windStrength" },
    timer: {
        absoluteHourToStop: "absoluteHourToStop",
        absoluteMinuteToStop: "absoluteMinuteToStop",
        absoluteHourToStart: "absoluteHourToStart",
        absoluteMinuteToStart: "absoluteMinuteToStart",
        relativeHourToStop: "relativeHourToStop",
        relativeMinuteToStop: "relativeMinuteToStop",
        relativeHourToStart: "relativeHourToStart",
        relativeMinuteToStart: "relativeMinuteToStart",
    },
    sleepTimer: {
        relativeHourToStop: "sleepTimerRelativeHourToStop",
        relativeMinuteToStop: "sleepTimerRelativeMinuteToStop",
    },
};

export const VENTILATOR_CUSTOM_PROPERTIES: CustomProperties = ["temperature"];
export const VENTILATOR_LOCATION_MAP: LocationMap = {};

export const ventilatorCustomResourcePropertiesHandler: CustomResourcePropertiesHandler =
    (resourceKey, resourceProperty, props, profile): [string[], string[]] => {
        const readableProps: string[] = [];
        const writableProps: string[] = [];
        if (!_.includes(VENTILATOR_CUSTOM_PROPERTIES, resourceKey)) {
            return [readableProps, writableProps];
        }

        for (const [propKey, propAttr] of _.toPairs(props)) {
            const prop = profile._getProperties(
                resourceProperty as Record<string, DynamicObjectOrStringArray>,
                propKey,
            );
            _.unset(prop, "unit");
            if (prop[READABILITY] === true) {
                readableProps.push(propAttr);
            }
            if (prop[WRITABILITY] === true) {
                writableProps.push(propAttr);
            }
            profile._setPropAttr(propAttr, prop);
        }

        return [readableProps, writableProps];
    };

export const VENTILATOR_PROFILE_DEFINITION: ConnectDeviceProfileDefinition = {
    resourceMap: VENTILATOR_RESOURCE_MAP,
    profileMap: VENTILATOR_PROFILE_MAP,
    locationMap: VENTILATOR_LOCATION_MAP,
    customProperties: VENTILATOR_CUSTOM_PROPERTIES,
    customResourcePropertiesHandler: ventilatorCustomResourcePropertiesHandler,
};

export class VentilatorProfile extends ConnectDeviceProfile {
    static _RESOURCE_MAP: ResourceMap = VENTILATOR_RESOURCE_MAP;
    static _PROFILE: ProfileMap = VENTILATOR_PROFILE_MAP;
    static _CUSTOM_PROPERTIES: CustomProperties = VENTILATOR_CUSTOM_PROPERTIES;
    static _LOCATION_MAP: LocationMap = VENTILATOR_LOCATION_MAP;

    constructor(profile: Record<string, DynamicObjectOrStringArray>) {
        super(
            profile,
            VENTILATOR_PROFILE_DEFINITION.resourceMap,
            VENTILATOR_PROFILE_DEFINITION.profileMap,
            VENTILATOR_PROFILE_DEFINITION.locationMap,
            VENTILATOR_PROFILE_DEFINITION.customProperties,
            VENTILATOR_PROFILE_DEFINITION.useExtensionProperty,
            VENTILATOR_PROFILE_DEFINITION.useSubProfileOnly,
            VENTILATOR_PROFILE_DEFINITION.locationName,
            VENTILATOR_PROFILE_DEFINITION.useNotification,
            VENTILATOR_PROFILE_DEFINITION.customResourcePropertiesHandler,
        );
    }
}

export const createVentilatorProfile = (
    profile: Record<string, DynamicObjectOrStringArray>,
): ConnectDeviceProfile => {
    return createConnectDeviceProfile(profile, VENTILATOR_PROFILE_DEFINITION);
};

export class VentilatorDevice extends ConnectBaseDevice {
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
            createVentilatorProfile(profile),
            VentilatorDevice._CUSTOM_SET_PROPERTY_NAME,
            undefined,
            energyProfile,
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

    setVentilatorOperationMode = async (
        mode: string,
    ): Promise<ThinQApiResponse | undefined> => {
        return await this.doEnumAttributeCommand(
            "ventilatorOperationMode",
            mode,
        );
    };

    setAbsoluteTimeToStart = async (
        hour: number,
        minute: number,
    ): Promise<ThinQApiResponse | undefined> => {
        return await this.doMultiAttributeCommand({
            absoluteHourToStart: hour,
            absoluteMinuteToStart: minute,
        });
    };

    setAbsoluteTimeToStop = async (
        hour: number,
        minute: number,
    ): Promise<ThinQApiResponse | undefined> => {
        return await this.doMultiAttributeCommand({
            absoluteHourToStop: hour,
            absoluteMinuteToStop: minute,
        });
    };

    setSleepTimerRelativeTimeToStop = async (
        hour: number,
        minute: number,
    ): Promise<ThinQApiResponse | undefined> => {
        return await this.doMultiAttributeCommand({
            sleepTimerRelativeHourToStop: hour,
            ...(minute !== 0 ? { sleepTimerRelativeMinuteToStop: minute } : {}),
        });
    };

    setWindStrength = async (
        strength: string,
    ): Promise<ThinQApiResponse | undefined> => {
        return await this.doEnumAttributeCommand("windStrength", strength);
    };
}
