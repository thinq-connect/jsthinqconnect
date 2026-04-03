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

export class AirPurifierProfile extends ConnectDeviceProfile {
    static _RESOURCE_MAP: ResourceMap = {
        airPurifierJobMode: "airPurifierJobMode",
        operation: "operation",
        timer: "timer",
        sleepTimer: "sleepTimer",
        airFlow: "airFlow",
        airQualitySensor: "airQualitySensor",
        filterInfo: "filterInfo",
    };
    static _PROFILE: ProfileMap = {
        airPurifierJobMode: {
            currentJobMode: "currentJobMode",
            personalizationMode: "personalizationMode",
        },
        operation: { airPurifierOperationMode: "airPurifierOperationMode" },
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
        airFlow: { windStrength: "windStrength" },
        airQualitySensor: {
            monitoringEnabled: "monitoringEnabled",
            PM1: "pm1",
            PM1Level: "pm1Level",
            PM2: "pm2",
            PM2Level: "pm2Level",
            PM10: "pm10",
            PM10Level: "pm10Level",
            odor: "odor",
            odorLevel: "odorLevel",
            humidity: "humidity",
            totalPollution: "totalPollution",
            totalPollutionLevel: "totalPollutionLevel",
        },
        filterInfo: {
            filterRemainPercent: "filterRemainPercent",
            topFilterRemainPercent: "topFilterRemainPercent",
        },
    };
    static _CUSTOM_PROPERTIES: CustomProperties = [];
    static _LOCATION_MAP: LocationMap = {};

    constructor(profile: Record<string, any>) {
        super(
            profile,
            AirPurifierProfile._RESOURCE_MAP,
            getAirPurifierProfileMap(profile),
            AirPurifierProfile._LOCATION_MAP,
            AirPurifierProfile._CUSTOM_PROPERTIES,
        );
    }
}

const getAirPurifierProfileMap = (
    profile: Record<string, DynamicObjectOrStringArray>,
): ProfileMap => {
    const windStrengthKey =
        ConnectDeviceProfile.prototype._getPreferredPropertyKey(
            profile,
            "airFlow",
            ["windStrengthDetail", "windStrength"],
        );

    return {
        ...AirPurifierProfile._PROFILE,
        airFlow: { [windStrengthKey]: "windStrength" },
    };
};

export const AIR_PURIFIER_RESOURCE_MAP: ResourceMap =
    AirPurifierProfile._RESOURCE_MAP;
export const AIR_PURIFIER_PROFILE_MAP: ProfileMap = AirPurifierProfile._PROFILE;
export const AIR_PURIFIER_CUSTOM_PROPERTIES: CustomProperties =
    AirPurifierProfile._CUSTOM_PROPERTIES;
export const AIR_PURIFIER_LOCATION_MAP: LocationMap =
    AirPurifierProfile._LOCATION_MAP;
export const AIR_PURIFIER_PROFILE_DEFINITION: ConnectDeviceProfileDefinition = {
    resourceMap: AIR_PURIFIER_RESOURCE_MAP,
    profileMap: AIR_PURIFIER_PROFILE_MAP,
    locationMap: AIR_PURIFIER_LOCATION_MAP,
    customProperties: AIR_PURIFIER_CUSTOM_PROPERTIES,
};
export const createAirPurifierProfile = (
    profile: Record<string, DynamicObjectOrStringArray>,
): ConnectDeviceProfile =>
    createConnectDeviceProfile(profile, {
        ...AIR_PURIFIER_PROFILE_DEFINITION,
        profileMap: getAirPurifierProfileMap(profile),
    });

export class AirPurifierDevice extends ConnectBaseDevice {
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
            createAirPurifierProfile(profile),
            AirPurifierDevice._CUSTOM_SET_PROPERTY_NAME,
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

    setAirPurifierOperationMode = async (
        mode: string,
    ): Promise<ThinQApiResponse | undefined> => {
        return await this.doEnumAttributeCommand(
            "airPurifierOperationMode",
            mode,
        );
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

    setWindStrength = async (
        strength: string,
    ): Promise<ThinQApiResponse | undefined> => {
        return await this.doEnumAttributeCommand("windStrength", strength);
    };
}
