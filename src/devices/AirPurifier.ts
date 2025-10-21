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

export class AirPurifierProfile extends ConnectDeviceProfile {
    static _RESOURCE_MAP: ResourceMap = {
        airPurifierJobMode: "airPurifierJobMode",
        operation: "operation",
        timer: "timer",
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
        airFlow: { windStrength: "windStrength" },
        airQualitySensor: {
            monitoringEnabled: "monitoringEnabled",
            PM1: "pm1",
            PM2: "pm2",
            PM10: "pm10",
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
            AirPurifierProfile._PROFILE,
            AirPurifierProfile._LOCATION_MAP,
            AirPurifierProfile._CUSTOM_PROPERTIES,
        );
    }
}

export class AirPurifierDevice extends ConnectBaseDevice {
    static _CUSTOM_SET_PROPERTY_NAME = {
        absoluteHourToStart: "absoluteTimeToStart",
        absoluteMinuteToStart: "absoluteTimeToStart",
        absoluteHourToStop: "absoluteTimeToStop",
        absoluteMinuteToStop: "absoluteTimeToStop",
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
            new AirPurifierProfile(profile),
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

    setWindStrength = async (
        strength: string,
    ): Promise<ThinQApiResponse | undefined> => {
        return await this.doEnumAttributeCommand("windStrength", strength);
    };
}
