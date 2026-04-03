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
import { ThinQApi } from "../ThinQAPI";

export class HomeBrewProfile extends ConnectDeviceProfile {
    static _RESOURCE_MAP: ResourceMap = {
        runState: "runState",
        recipe: "recipe",
        timer: "timer",
    };
    static _PROFILE: ProfileMap = {
        runState: { currentState: "currentState" },
        recipe: {
            beerRemain: "beerRemain",
            flavorInfo: "flavorInfo",
            flavorCapsule1: "flavorCapsule1",
            flavorCapsule2: "flavorCapsule2",
            hopOilInfo: "hopOilInfo",
            hopOilCapsule1: "hopOilCapsule1",
            hopOilCapsule2: "hopOilCapsule2",
            wortInfo: "wortInfo",
            yeastInfo: "yeastInfo",
            recipeName: "recipeName",
        },
        timer: {
            elapsedDayState: "elapsedDayState",
            elapsedDayTotal: "elapsedDayTotal",
        },
    };
    static _CUSTOM_PROPERTIES: CustomProperties = [];
    static _LOCATION_MAP: LocationMap = {};

    constructor(profile: Record<string, any>) {
        super(
            profile,
            HomeBrewProfile._RESOURCE_MAP,
            HomeBrewProfile._PROFILE,
            HomeBrewProfile._LOCATION_MAP,
            HomeBrewProfile._CUSTOM_PROPERTIES,
        );
    }
}

export const HOME_BREW_RESOURCE_MAP: ResourceMap =
    HomeBrewProfile._RESOURCE_MAP;
export const HOME_BREW_PROFILE_MAP: ProfileMap = HomeBrewProfile._PROFILE;
export const HOME_BREW_CUSTOM_PROPERTIES: CustomProperties =
    HomeBrewProfile._CUSTOM_PROPERTIES;
export const HOME_BREW_LOCATION_MAP: LocationMap =
    HomeBrewProfile._LOCATION_MAP;
export const HOME_BREW_PROFILE_DEFINITION: ConnectDeviceProfileDefinition = {
    resourceMap: HOME_BREW_RESOURCE_MAP,
    profileMap: HOME_BREW_PROFILE_MAP,
    locationMap: HOME_BREW_LOCATION_MAP,
    customProperties: HOME_BREW_CUSTOM_PROPERTIES,
};
export const createHomeBrewProfile = (
    profile: Record<string, DynamicObjectOrStringArray>,
): ConnectDeviceProfile =>
    createConnectDeviceProfile(profile, HOME_BREW_PROFILE_DEFINITION);

export class HomeBrewDevice extends ConnectBaseDevice {
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
            createHomeBrewProfile(profile),
            undefined,
            undefined,
            energyProfile,
        );
    }

    get profiles(): ConnectDeviceProfile {
        return this._profiles;
    }
}
