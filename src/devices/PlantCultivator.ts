/*
 * SPDX-FileCopyrightText: Copyright 2025 LG Electronics Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import _ from "lodash";
import {
    ConnectMainDevice,
    ConnectSubDevice,
    ConnectDeviceProfile,
    ConnectDeviceProfileDefinition,
} from "./ConnectDevice";
import {
    ResourceMap,
    ProfileMap,
    LocationMap,
    CustomProperties,
} from "../types/Resources";
import { DynamicObjectOrStringArray } from "../types/Devices";
import { ThinQApi } from "../ThinQAPI";

export const PLANT_CULTIVATOR_RESOURCE_MAP: ResourceMap = {};
export const PLANT_CULTIVATOR_PROFILE_MAP: ProfileMap = {};
export const PLANT_CULTIVATOR_LOCATION_MAP: LocationMap = {
    UPPER: "upper",
    LOWER: "lower",
};
export const PLANT_CULTIVATOR_CUSTOM_PROPERTIES: CustomProperties = [];

export const PLANT_CULTIVATOR_PROFILE_DEFINITION: ConnectDeviceProfileDefinition =
    {
        resourceMap: PLANT_CULTIVATOR_RESOURCE_MAP,
        profileMap: PLANT_CULTIVATOR_PROFILE_MAP,
        locationMap: PLANT_CULTIVATOR_LOCATION_MAP,
        customProperties: PLANT_CULTIVATOR_CUSTOM_PROPERTIES,
        useSubProfileOnly: true,
    };

export const PLANT_CULTIVATOR_SUB_RESOURCE_MAP: ResourceMap = {
    runState: "runState",
    light: "light",
    temperature: "temperature",
};

export const PLANT_CULTIVATOR_SUB_PROFILE_MAP: ProfileMap = {
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
export const PLANT_CULTIVATOR_SUB_LOCATION_MAP: LocationMap = {};

type PlantCultivatorPropertyEntry = Record<string, unknown>;
type PlantCultivatorLocationProperties = Record<
    string,
    Record<string, string[]>
>;

const getPlantCultivatorProfileEntries = (
    profile: Record<string, DynamicObjectOrStringArray>,
): PlantCultivatorPropertyEntry[] => {
    const profileEntries = _.get(profile, "property", []);
    return Array.isArray(profileEntries)
        ? (profileEntries as PlantCultivatorPropertyEntry[])
        : [];
};

const getPlantCultivatorLocationName = (
    profileProperty: PlantCultivatorPropertyEntry,
): string | undefined => {
    return _.get(profileProperty, "location.locationName") as
        | string
        | undefined;
};

const initializePlantCultivatorLocationProfiles = (
    mainProfile: PlantCultivatorProfile,
    profile: Record<string, DynamicObjectOrStringArray>,
): void => {
    const locationProperties: PlantCultivatorLocationProperties = {};
    for (const profileProperty of getPlantCultivatorProfileEntries(profile)) {
        const locationName = getPlantCultivatorLocationName(profileProperty);
        if (!locationName || !(locationName in PLANT_CULTIVATOR_LOCATION_MAP)) {
            continue;
        }
        const attrKey = PLANT_CULTIVATOR_LOCATION_MAP[locationName];
        const subProfile = createPlantCultivatorSubProfile(
            profile,
            locationName,
        );
        mainProfile[attrKey] = subProfile;
        locationProperties[attrKey] = subProfile.properties;
    }
    mainProfile._locationProperties = locationProperties;
    mainProfile.generatePropertyMap();
};

const getPlantCultivatorLocationPropertyEntries = (
    property:
        | PlantCultivatorPropertyEntry
        | PlantCultivatorPropertyEntry[]
        | Record<string, unknown>[],
    locationName: string | null,
): PlantCultivatorPropertyEntry[] => {
    if (!Array.isArray(property)) {
        return [property];
    }
    return property.filter(
        (locationProperty) =>
            getPlantCultivatorLocationName(locationProperty) === locationName,
    );
};

export class PlantCultivatorProfile extends ConnectDeviceProfile {
    static _RESOURCE_MAP: ResourceMap = PLANT_CULTIVATOR_RESOURCE_MAP;
    static _PROFILE: ProfileMap = PLANT_CULTIVATOR_PROFILE_MAP;
    static _LOCATION_MAP: LocationMap = PLANT_CULTIVATOR_LOCATION_MAP;
    static _CUSTOM_PROPERTIES: CustomProperties =
        PLANT_CULTIVATOR_CUSTOM_PROPERTIES;

    constructor(profile: Record<string, DynamicObjectOrStringArray>) {
        super(
            profile,
            PLANT_CULTIVATOR_PROFILE_DEFINITION.resourceMap,
            PLANT_CULTIVATOR_PROFILE_DEFINITION.profileMap,
            PLANT_CULTIVATOR_PROFILE_DEFINITION.locationMap,
            PLANT_CULTIVATOR_PROFILE_DEFINITION.customProperties,
            PLANT_CULTIVATOR_PROFILE_DEFINITION.useExtensionProperty,
            PLANT_CULTIVATOR_PROFILE_DEFINITION.useSubProfileOnly,
        );
        initializePlantCultivatorLocationProfiles(this, profile);
    }
}

export class PlantCultivatorSubProfile extends ConnectDeviceProfile {
    static _RESOURCE_MAP: ResourceMap = PLANT_CULTIVATOR_SUB_RESOURCE_MAP;
    static _PROFILE: ProfileMap = PLANT_CULTIVATOR_SUB_PROFILE_MAP;
    static _LOCATION_MAP: LocationMap = PLANT_CULTIVATOR_SUB_LOCATION_MAP;
    static _CUSTOM_PROPERTIES: CustomProperties = [];

    constructor(
        profile: Record<string, DynamicObjectOrStringArray>,
        locationName: string,
    ) {
        super(
            profile,
            PLANT_CULTIVATOR_SUB_RESOURCE_MAP,
            PLANT_CULTIVATOR_SUB_PROFILE_MAP,
            PLANT_CULTIVATOR_SUB_LOCATION_MAP,
            PLANT_CULTIVATOR_CUSTOM_PROPERTIES,
            false,
            false,
            locationName,
        );
        this._locationName = locationName;
    }

    generateProperties(
        property: PlantCultivatorPropertyEntry | PlantCultivatorPropertyEntry[],
    ): void {
        for (const locationProperty of getPlantCultivatorLocationPropertyEntries(
            property,
            this._locationName,
        )) {
            super.generateProperties(locationProperty);
        }
    }
}

export const createPlantCultivatorSubProfile = (
    profile: Record<string, DynamicObjectOrStringArray>,
    locationName: string,
): ConnectDeviceProfile => {
    return new PlantCultivatorSubProfile(profile, locationName);
};

export const createPlantCultivatorProfile = (
    profile: Record<string, DynamicObjectOrStringArray>,
): ConnectDeviceProfile => {
    return new PlantCultivatorProfile(profile);
};

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
            createPlantCultivatorProfile(profile),
            PlantCultivatorSubDevice,
            energyProfile,
        );
    }

    get profiles(): ConnectDeviceProfile {
        return this._profiles;
    }

    getSubDevice(locationName: string): ConnectSubDevice | null {
        return super.getSubDevice(locationName) as ConnectSubDevice | null;
    }
}
