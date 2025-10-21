/*
 * SPDX-FileCopyrightText: Copyright 2025 LG Electronics Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import _ from "lodash";
import { ConnectBaseDevice, ConnectDeviceProfile } from "./ConnectDevice";
import {
    ResourceMap,
    ProfileMap,
    CustomProperties,
    LocationMap,
} from "../types/Resources";
import { ThinQApi, ThinQApiResponse } from "../ThinQAPI";

export class HumidifierProfile extends ConnectDeviceProfile {
    static _RESOURCE_MAP: ResourceMap = {
        humidifierJobMode: "humidifierJobMode",
        operation: "operation",
        timer: "timer",
        sleepTimer: "sleepTimer",
        humidity: "humidity",
        airFlow: "airFlow",
        airQualitySensor: "airQualitySensor",
        display: "display",
        moodLamp: "moodLamp",
    };
    static _PROFILE: ProfileMap = {
        humidifierJobMode: { currentJobMode: "currentJobMode" },
        operation: {
            humidifierOperationMode: "humidifierOperationMode",
            autoMode: "autoMode",
            sleepMode: "sleepMode",
            hygieneDryMode: "hygieneDryMode",
        },
        timer: {
            absoluteHourToStart: "absoluteHourToStart",
            absoluteHourToStop: "absoluteHourToStop",
            absoluteMinuteToStart: "absoluteMinuteToStart",
            absoluteMinuteToStop: "absoluteMinuteToStop",
        },
        sleepTimer: {
            relativeHourToStop: "sleepTimerRelativeHourToStop",
            relativeMinuteToStop: "sleepTimerRelativeMinuteToStop",
        },
        humidity: { targetHumidity: "targetHumidity", warmMode: "warmMode" },
        airFlow: { windStrength: "windStrength" },
        airQualitySensor: {
            monitoringEnabled: "monitoringEnabled",
            totalPollution: "totalPollution",
            totalPollutionLevel: "totalPollutionLevel",
            PM1: "pm1",
            PM2: "pm2",
            PM10: "pm10",
            humidity: "humidity",
            temperature: "temperature",
        },
        display: { light: "displayLight" },
        moodLamp: { moodLampState: "moodLampState" },
    };
    static _CUSTOM_PROPERTIES: CustomProperties = [];
    static _LOCATION_MAP: LocationMap = {};

    constructor(profile: Record<string, any>) {
        super(
            profile,
            HumidifierProfile._RESOURCE_MAP,
            HumidifierProfile._PROFILE,
            HumidifierProfile._LOCATION_MAP,
            HumidifierProfile._CUSTOM_PROPERTIES,
        );
    }
}

export class HumidifierDevice extends ConnectBaseDevice {
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
            new HumidifierProfile(profile),
            HumidifierDevice._CUSTOM_SET_PROPERTY_NAME,
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

    setHumidifierOperationMode = async (
        mode: string,
    ): Promise<ThinQApiResponse | undefined> => {
        return await this.doEnumAttributeCommand(
            "humidifierOperationMode",
            mode,
        );
    };

    setAutoMode = async (
        mode: string,
    ): Promise<ThinQApiResponse | undefined> => {
        return await this.doEnumAttributeCommand("autoMode", mode);
    };

    setSleepMode = async (
        mode: string,
    ): Promise<ThinQApiResponse | undefined> => {
        return await this.doEnumAttributeCommand("sleepMode", mode);
    };

    setHygieneDryMode = async (
        mode: string,
    ): Promise<ThinQApiResponse | undefined> => {
        return await this.doEnumAttributeCommand("hygieneDryMode", mode);
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
        minute = 0,
    ): Promise<ThinQApiResponse> => {
        return await this.doMultiAttributeCommand({
            sleepTimerRelativeHourToStop: hour,
            ...(minute !== 0 ? { sleepTimerRelativeMinuteToStop: minute } : {}),
        });
    };

    setTargetHumidity = async (
        humidity: number,
    ): Promise<ThinQApiResponse | undefined> => {
        return await this.doAttributeCommand("targetHumidity", humidity);
    };

    setWarmMode = async (
        mode: string,
    ): Promise<ThinQApiResponse | undefined> => {
        return await this.doEnumAttributeCommand("warmMode", mode);
    };

    setWindStrength = async (
        strength: string,
    ): Promise<ThinQApiResponse | undefined> => {
        return await this.doEnumAttributeCommand("windStrength", strength);
    };

    setDisplayLight = async (
        light: string,
    ): Promise<ThinQApiResponse | undefined> => {
        return await this.doEnumAttributeCommand("displayLight", light);
    };

    setMoodLampState = async (
        state: string,
    ): Promise<ThinQApiResponse | undefined> => {
        return await this.doEnumAttributeCommand("moodLampState", state);
    };
}
