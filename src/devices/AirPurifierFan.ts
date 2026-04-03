/*
 * SPDX-FileCopyrightText: Copyright 2025 LG Electronics Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {
    ConnectBaseDevice,
    ConnectDeviceProfile,
    ConnectDeviceProfileDefinition,
    createConnectDeviceProfile,
} from "./ConnectDevice";
import {
    ResourceMap,
    ProfileMap,
    CustomProperties,
    LocationMap,
} from "../types/Resources";
import { DynamicObjectOrStringArray } from "../types/Devices";
import { ThinQApi, ThinQApiResponse } from "../ThinQAPI";

export class AirPurifierFanProfile extends ConnectDeviceProfile {
    static _RESOURCE_MAP: ResourceMap = {
        airFanJobMode: "airFanJobMode",
        operation: "operation",
        timer: "timer",
        sleepTimer: "sleepTimer",
        airFlow: "airFlow",
        airQualitySensor: "airQualitySensor",
        display: "display",
        misc: "misc",
    };
    static _PROFILE: ProfileMap = {
        airFanJobMode: { currentJobMode: "currentJobMode" },
        operation: { airFanOperationMode: "airFanOperationMode" },
        timer: {
            absoluteHourToStart: "absoluteHourToStart",
            absoluteMinuteToStart: "absoluteMinuteToStart",
            absoluteHourToStop: "absoluteHourToStop",
            absoluteMinuteToStop: "absoluteMinuteToStop",
        },
        sleepTimer: {
            relativeHourToStop: "sleepTimerRelativeHourToStop",
            relativeMinuteToStop: "sleepTimerRelativeMinuteToStop",
        },
        airFlow: {
            warmMode: "warmMode",
            windTemperature: "windTemperature",
            windStrength: "windStrength",
            windAngle: "windAngle",
        },
        airQualitySensor: {
            monitoringEnabled: "monitoringEnabled",
            PM1: "pm1",
            PM2: "pm2",
            PM10: "pm10",
            humidity: "humidity",
            temperature: "temperature",
            odor: "odor",
            odorLevel: "odorLevel",
            totalPollution: "totalPollution",
            totalPollutionLevel: "totalPollutionLevel",
        },
        display: { light: "displayLight" },
        misc: { uvNano: "uvNano" },
    };
    static _CUSTOM_PROPERTIES: CustomProperties = [];
    static _LOCATION_MAP: LocationMap = {};

    constructor(profile: Record<string, any>) {
        super(
            profile,
            AirPurifierFanProfile._RESOURCE_MAP,
            AirPurifierFanProfile._PROFILE,
            AirPurifierFanProfile._LOCATION_MAP,
            AirPurifierFanProfile._CUSTOM_PROPERTIES,
        );
    }
}

export const AIR_PURIFIER_FAN_RESOURCE_MAP: ResourceMap =
    AirPurifierFanProfile._RESOURCE_MAP;
export const AIR_PURIFIER_FAN_PROFILE_MAP: ProfileMap =
    AirPurifierFanProfile._PROFILE;
export const AIR_PURIFIER_FAN_CUSTOM_PROPERTIES: CustomProperties =
    AirPurifierFanProfile._CUSTOM_PROPERTIES;
export const AIR_PURIFIER_FAN_LOCATION_MAP: LocationMap =
    AirPurifierFanProfile._LOCATION_MAP;
export const AIR_PURIFIER_FAN_PROFILE_DEFINITION: ConnectDeviceProfileDefinition =
    {
        resourceMap: AIR_PURIFIER_FAN_RESOURCE_MAP,
        profileMap: AIR_PURIFIER_FAN_PROFILE_MAP,
        locationMap: AIR_PURIFIER_FAN_LOCATION_MAP,
        customProperties: AIR_PURIFIER_FAN_CUSTOM_PROPERTIES,
    };
export const createAirPurifierFanProfile = (
    profile: Record<string, DynamicObjectOrStringArray>,
): ConnectDeviceProfile =>
    createConnectDeviceProfile(profile, AIR_PURIFIER_FAN_PROFILE_DEFINITION);

export class AirPurifierFanDevice extends ConnectBaseDevice {
    static _CUSTOM_SET_PROPERTY_NAME = {
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
            createAirPurifierFanProfile(profile),
            AirPurifierFanDevice._CUSTOM_SET_PROPERTY_NAME,
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

    setAirFanOperationMode = async (
        mode: string,
    ): Promise<ThinQApiResponse | undefined> => {
        return await this.doEnumAttributeCommand("airFanOperationMode", mode);
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
    ): Promise<ThinQApiResponse> => {
        return await this.doMultiAttributeCommand({
            sleepTimerRelativeHourToStop: hour,
        });
    };

    setWarmMode = async (
        mode: string,
    ): Promise<ThinQApiResponse | undefined> => {
        return await this.doEnumAttributeCommand("warmMode", mode);
    };

    setWindTemperature = async (
        temperature: number,
    ): Promise<ThinQApiResponse | undefined> => {
        return await this.doAttributeCommand("windTemperature", temperature);
    };

    setWindStrength = async (
        strength: string,
    ): Promise<ThinQApiResponse | undefined> => {
        return await this.doEnumAttributeCommand("windStrength", strength);
    };

    setWindAngle = async (
        angle: string,
    ): Promise<ThinQApiResponse | undefined> => {
        return await this.doEnumAttributeCommand("windAngle", angle);
    };

    setDisplayLight = async (
        light: string,
    ): Promise<ThinQApiResponse | undefined> => {
        return await this.doEnumAttributeCommand("displayLight", light);
    };

    setUvNano = async (
        uvNano: string,
    ): Promise<ThinQApiResponse | undefined> => {
        return await this.doEnumAttributeCommand("uvNano", uvNano);
    };
}
