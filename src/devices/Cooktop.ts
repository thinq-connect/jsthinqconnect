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
    CustomProperties,
    LocationMap,
} from "../types/Resources";
import { AttributePayload } from "../types/Devices";
import { ThinQApi, ThinQApiResponse } from "../ThinQAPI";

export class CooktopSubProfile extends ConnectDeviceProfile {
    static _RESOURCE_MAP: ResourceMap = {
        cookingZone: "cookingZone",
        power: "power",
        remoteControlEnable: "remoteControlEnable",
        timer: "timer",
    };

    static _PROFILE: ProfileMap = {
        cookingZone: { currentState: "currentState" },
        power: { powerLevel: "powerLevel" },
        remoteControlEnable: { remoteControlEnabled: "remoteControlEnabled" },
        timer: { remainHour: "remainHour", remainMinute: "remainMinute" },
    };
    static _CUSTOM_PROPERTIES: CustomProperties = [];
    static _LOCATION_MAP: LocationMap = {};

    constructor(profile: Record<string, any>, locationName: string) {
        super(
            profile,
            CooktopSubProfile._RESOURCE_MAP,
            CooktopSubProfile._PROFILE,
            CooktopSubProfile._LOCATION_MAP,
            CooktopSubProfile._CUSTOM_PROPERTIES,
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

export class CooktopProfile extends ConnectDeviceProfile {
    static _RESOURCE_MAP: ResourceMap = { operation: "operation" };
    static _PROFILE: ProfileMap = {
        operation: { operationMode: "operationMode" },
    };
    static _LOCATION_MAP: LocationMap = {
        CENTER: "center",
        CENTER_FRONT: "centerFront",
        CENTER_REAR: "centerRear",
        LEFT_FRONT: "leftFront",
        LEFT_REAR: "leftRear",
        RIGHT_FRONT: "rightFront",
        RIGHT_REAR: "rightRear",
        BURNER_1: "burner_1",
        BURNER_2: "burner_2",
        BURNER_3: "burner_3",
        BURNER_4: "burner_4",
        BURNER_5: "burner_5",
        BURNER_6: "burner_6",
        BURNER_7: "burner_7",
        BURNER_8: "burner_8",
        INDUCTION_1: "induction_1",
        INDUCTION_2: "induction_2",
        SOUSVIDE_1: "sousvide_1",
    };
    static _CUSTOM_PROPERTIES: CustomProperties = [];
    constructor(profile: Record<string, any>) {
        super(
            profile,
            CooktopProfile._RESOURCE_MAP,
            CooktopProfile._PROFILE,
            CooktopProfile._LOCATION_MAP,
            CooktopProfile._CUSTOM_PROPERTIES,
            true,
            false,
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
            if (locationName in CooktopProfile._LOCATION_MAP) {
                const attrKey = CooktopProfile._LOCATION_MAP[locationName];
                const _subProfile = new CooktopSubProfile(
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

export class CooktopSubDevice extends ConnectSubDevice {
    constructor(
        profiles: ConnectDeviceProfile,
        locationName: string,
        thinqApi: ThinQApi,
        deviceId: string,
        deviceType: string,
        modelName: string,
        alias: string,
        reportable: boolean,
        singleUnit: boolean,
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
            singleUnit,
            undefined,
            energyProfile,
        );
    }

    get profiles(): ConnectDeviceProfile {
        return this._profiles;
    }

    _getCommandPayload = (): Record<string, unknown> => {
        return {
            power: { powerLevel: this.getStatus("powerLevel") },
            timer: {
                remainHour: this.getStatus("remainHour"),
                remainMinute: this.getStatus("remainMinute"),
            },
            location: { locationName: this.locationName },
        };
    };

    _doCustomRangeAttributeCommand = async (
        attribute: string,
        value: number,
    ): Promise<ThinQApiResponse> => {
        const fullPayload: Record<string, unknown> = this._getCommandPayload();
        const payload = this.profiles.getRangeAttributePayload(
            attribute,
            value,
        ) as AttributePayload;
        for (const resource in payload) {
            fullPayload[resource] = payload[resource];
        }
        return await this.thinqApi.asyncPostDeviceControl(
            this.deviceId,
            fullPayload,
        );
    };

    setPowerLevel = async (level: number): Promise<ThinQApiResponse> => {
        return await this._doCustomRangeAttributeCommand("powerLevel", level);
    };

    setRemainHour = async (hour: number): Promise<ThinQApiResponse> => {
        return await this._doCustomRangeAttributeCommand("remainHour", hour);
    };

    setRemainMinute = async (minute: number): Promise<ThinQApiResponse> => {
        return await this._doCustomRangeAttributeCommand(
            "remainMinute",
            minute,
        );
    };
}

export class CooktopDevice extends ConnectMainDevice {
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
            new CooktopProfile(profile),
            CooktopSubDevice,
            energyProfile,
        );
    }

    get profiles(): ConnectDeviceProfile {
        return this._profiles;
    }

    getSubDevice(locationName: string): ConnectSubDevice | null {
        return super.getSubDevice(locationName);
    }

    setOperationMode = async (
        mode: string,
    ): Promise<ThinQApiResponse | undefined> => {
        return await this.doEnumAttributeCommand("operationMode", mode);
    };

    setPowerLevel = async (
        locationName: string,
        value: number,
    ): Promise<ThinQApiResponse | undefined> => {
        const subDevice = this._subDevices[locationName] as
            | CooktopSubDevice
            | undefined;
        if (subDevice) {
            return await subDevice.setPowerLevel(value);
        } else {
            throw new Error(`Invalid location: ${locationName}`);
        }
    };

    setRemainHour = async (
        locationName: string,
        value: number,
    ): Promise<ThinQApiResponse | undefined> => {
        const subDevice = this._subDevices[locationName] as
            | CooktopSubDevice
            | undefined;
        if (subDevice) {
            return await subDevice.setRemainHour(value);
        } else {
            throw new Error(`Invalid location: ${locationName}`);
        }
    };

    setRemainMinute = async (
        locationName: string,
        value: number,
    ): Promise<ThinQApiResponse | undefined> => {
        const subDevice = this._subDevices[locationName] as
            | CooktopSubDevice
            | undefined;
        if (subDevice) {
            return await subDevice.setRemainMinute(value);
        } else {
            throw new Error(`Invalid location: ${locationName}`);
        }
    };
}
