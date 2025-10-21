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

export class HomeBrewDevice extends ConnectBaseDevice {
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
            new HomeBrewProfile(profile),
            undefined,
            undefined,
            energyProfile,
        );
    }

    get profiles(): ConnectDeviceProfile {
        return this._profiles;
    }
}
