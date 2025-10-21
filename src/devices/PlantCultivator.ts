/*
 * SPDX-FileCopyrightText: Copyright 2025 LG Electronics Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import _ from "lodash";
import {
    ConnectMainDevice,
    ConnectSubDevice,
    ConnectDeviceProfile,
} from "./ConnectDevice";
import {
    ResourceMap,
    ProfileMap,
    LocationMap,
    CustomProperties,
} from "../types/Resources";
import { ThinQApi } from "../ThinQAPI";

export class PlantCultivatorProfile extends ConnectDeviceProfile {
    static _RESOURCE_MAP: ResourceMap = {};
    static _PROFILE: ProfileMap = {};
    static _LOCATION_MAP: LocationMap = {
        UPPER: "upper",
        LOWER: "lower",
    };
    static _CUSTOM_PROPERTIES: CustomProperties = [];

    constructor(profile: Record<string, any>) {
        super(
            profile,
            PlantCultivatorProfile._RESOURCE_MAP,
            PlantCultivatorProfile._PROFILE,
            PlantCultivatorProfile._LOCATION_MAP,
            PlantCultivatorProfile._CUSTOM_PROPERTIES,
            false,
            true,
        );
        const _locationProperties: Record<
            string,
            Record<string, string[]>
        > = {};
        for (const profileProperty of _.get(profile, "property", [])) {
            const locationName = _.get(
                profileProperty,
                "location.locationName",
            );
            if (locationName in PlantCultivatorProfile._LOCATION_MAP) {
                const attrKey =
                    PlantCultivatorProfile._LOCATION_MAP[locationName];
                const _subProfile = new PlantCultivatorSubProfile(
                    profile,
                    locationName,
                );
                this[attrKey] = _subProfile;
                _locationProperties[attrKey] = _subProfile.properties;
            }
        }
        this._locationProperties = _locationProperties;
        this.generatePropertyMap();
    }
}

export class PlantCultivatorSubProfile extends ConnectDeviceProfile {
    static _RESOURCE_MAP: ResourceMap = {
        runState: "runState",
        light: "light",
        temperature: "temperature",
    };

    static _PROFILE: ProfileMap = {
        runState: {
            currentState: "currentState",
            growthMode: "growthMode",
            windVolume: "windVolume",
        },
        light: {
            brightness: "brightness",
            duration: "duration",
            startHour: "startHour",
            startMinute: "startMinute",
        },
        temperature: {
            dayTargetTemperature: "dayTargetTemperature",
            nightTargetTemperature: "nightTargetTemperature",
            temperatureState: "temperatureState",
        },
    };
    static _LOCATION_MAP: LocationMap = {};
    static _CUSTOM_PROPERTIES: CustomProperties = [];

    constructor(profile: Record<string, any>, locationName: string) {
        super(
            profile,
            PlantCultivatorSubProfile._RESOURCE_MAP,
            PlantCultivatorSubProfile._PROFILE,
            PlantCultivatorSubProfile._LOCATION_MAP,
            PlantCultivatorProfile._CUSTOM_PROPERTIES,
            false,
            false,
            locationName,
        );
        this._locationName = locationName;
    }

    generateProperties(property: Record<string, unknown>[]): void {
        for (const locationProperty of property) {
            if (
                _.get(locationProperty, "location.locationName") !==
                this._locationName
            ) {
                continue;
            }
            super.generateProperties(locationProperty);
        }
    }
}

export class PlantCultivatorSubDevice extends ConnectSubDevice {
    constructor(
        profiles: ConnectDeviceProfile,
        locationName: string,
        thinqApi: ThinQApi,
        deviceId: string,
        deviceType: string,
        modelName: string,
        alias: string,
        reportable: boolean,
        energyProfile?: Record<string, unknown>,
    ) {
        super(
            profiles,
            locationName,
            thinqApi,
            deviceId,
            deviceType,
            modelName,
            alias,
            reportable,
            undefined,
            undefined,
            energyProfile,
        );
    }

    get profiles(): ConnectDeviceProfile {
        return this._profiles;
    }
}

export class PlantCultivatorDevice extends ConnectMainDevice {
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
            new PlantCultivatorProfile(profile),
            PlantCultivatorSubDevice,
            energyProfile,
        );
    }

    get profiles(): ConnectDeviceProfile {
        return this._profiles;
    }

    getSubDevice(locationName: string): ConnectSubDevice | null {
        return super.getSubDevice(locationName);
    }
}
