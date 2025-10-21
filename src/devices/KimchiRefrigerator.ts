/*
 * SPDX-FileCopyrightText: Copyright 2025 LG Electronics Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import _ from "lodash";
import {
    ConnectMainDevice,
    ConnectSubDevice,
    ConnectDeviceProfile,
    READABILITY,
    WRITABILITY,
} from "./ConnectDevice";
import {
    ResourceMap,
    ProfileMap,
    LocationMap,
    CustomProperties,
} from "../types/Resources";
import { DynamicObjectOrStringArray } from "../types/Devices";
import { ThinQApi } from "../ThinQAPI";

export class KimchiRefrigeratorSubProfile extends ConnectDeviceProfile {
    static _RESOURCE_MAP: ResourceMap = {
        temperature: "temperature",
    };

    static _PROFILE: ProfileMap = {
        temperature: {
            locationName: "locationName",
            targetTemperature: "targetTemperature",
        },
    };
    static _CUSTOM_PROPERTIES: CustomProperties = ["temperature"];
    static _LOCATION_MAP: LocationMap = {};

    constructor(profile: Record<string, any>, locationName: string) {
        super(
            profile,
            KimchiRefrigeratorSubProfile._RESOURCE_MAP,
            KimchiRefrigeratorSubProfile._PROFILE,
            KimchiRefrigeratorSubProfile._LOCATION_MAP,
            KimchiRefrigeratorSubProfile._CUSTOM_PROPERTIES,
            false,
            false,
            locationName,
            false,
        );
        this._locationName = locationName;
    }

    _generateCustomResourceProperties(
        resourceKey: string,
        resourceProperty: Record<string, unknown>[],
        props: Record<string, string>,
    ): [string[], string[]] {
        const readableProps = [];
        const writableProps = [];
        for (const _temperature of resourceProperty) {
            if (_temperature["locationName"] === this._locationName) {
                const attrName =
                    this._PROFILE["temperature"]["targetTemperature"];
                const prop = this._getProperties(
                    _temperature as Record<string, DynamicObjectOrStringArray>,
                    "targetTemperature",
                );
                this._setPropAttr(attrName, prop);
                if (prop[READABILITY]) readableProps.push(attrName);
                if (prop[WRITABILITY]) writableProps.push(attrName);
            }
        }
        return [readableProps, writableProps];
    }
}

export class KimchiRefrigeratorProfile extends ConnectDeviceProfile {
    static _RESOURCE_MAP: ResourceMap = { refrigeration: "refrigeration" };
    static _PROFILE: ProfileMap = {
        refrigeration: {
            oneTouchFilter: "oneTouchFilter",
            freshAirFilter: "freshAirFilter",
        },
    };
    static _LOCATION_MAP: LocationMap = {
        TOP: "top",
        MIDDLE: "middle",
        BOTTOM: "bottom",
        LEFT: "left",
        RIGHT: "right",
        SINGLE: "single",
    };
    static _CUSTOM_PROPERTIES: CustomProperties = [];
    constructor(profile: Record<string, any>) {
        super(
            profile,
            KimchiRefrigeratorProfile._RESOURCE_MAP,
            KimchiRefrigeratorProfile._PROFILE,
            KimchiRefrigeratorProfile._LOCATION_MAP,
            KimchiRefrigeratorProfile._CUSTOM_PROPERTIES,
        );
        const _locationProperties: Record<
            string,
            Record<string, string[]>
        > = {};
        for (const temperatureProperty of _.get(
            profile,
            "property.temperature",
            [],
        )) {
            const locationName = _.get(temperatureProperty, "locationName");
            if (locationName in KimchiRefrigeratorProfile._LOCATION_MAP) {
                const attrKey =
                    KimchiRefrigeratorProfile._LOCATION_MAP[locationName];
                const _subProfile = new KimchiRefrigeratorSubProfile(
                    profile,
                    locationName,
                );
                this[attrKey] = _subProfile;
                _locationProperties[attrKey] = _subProfile.properties;
            }
        }
        this._locationProperties = _locationProperties;
    }
}

export class KimchiRefrigeratorSubDevice extends ConnectSubDevice {
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
            true,
            undefined,
            energyProfile,
        );
    }

    get profiles(): ConnectDeviceProfile {
        return this._profiles;
    }
}

export class KimchiRefrigeratorDevice extends ConnectMainDevice {
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
            new KimchiRefrigeratorProfile(profile),
            KimchiRefrigeratorSubDevice,
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
