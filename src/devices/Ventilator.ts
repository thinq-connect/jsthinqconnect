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
} from "../types/Devices";
import { ThinQApi, ThinQApiResponse } from "../ThinQAPI";

export class VentilatorProfile extends ConnectDeviceProfile {
    static _RESOURCE_MAP: ResourceMap = {
        ventJobMode: "ventJobMode",
        operation: "operation",
        temperature: "temperature",
        airQualitySensor: "airQualitySensor",
        airFlow: "airFlow",
        timer: "timer",
        sleepTimer: "sleepTimer",
    };
    static _PROFILE: ProfileMap = {
        ventJobMode: { currentJobMode: "currentJobMode" },
        operation: { ventOperationMode: "ventilatorOperationMode" },
        temperature: {
            currentTemperature: "currentTemperature",
            unit: "temperatureUnit",
        },
        airQualitySensor: {
            PM1: "PM1",
            PM2: "PM2",
            PM10: "PM10",
            CO2: "CO2",
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
    static _CUSTOM_PROPERTIES: CustomProperties = ["temperature"];
    static _LOCATION_MAP: LocationMap = {};

    constructor(profile: Record<string, any>) {
        super(
            profile,
            VentilatorProfile._RESOURCE_MAP,
            VentilatorProfile._PROFILE,
            VentilatorProfile._LOCATION_MAP,
            VentilatorProfile._CUSTOM_PROPERTIES,
        );
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

        for (const [propKey, propAttr] of _.toPairs(props)) {
            const prop = this._getProperties(
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
            this._setPropAttr(propAttr, prop);
        }

        return [readableProps, writableProps];
    }
}

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
            new VentilatorProfile(profile),
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
