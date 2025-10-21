/*
 * SPDX-FileCopyrightText: Copyright 2025 LG Electronics Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import _ from "lodash";
import { ConnectDeviceProfile } from "./ConnectDevice";
import {
    ResourceMap,
    ProfileMap,
    CustomProperties,
    LocationMap,
} from "../types/Resources";
import { WasherSubDevice } from "./Washer";
import { ThinQApi, ThinQApiResponse } from "../ThinQAPI";

export class WashcomboProfile extends ConnectDeviceProfile {
    static _RESOURCE_MAP: ResourceMap = {
        runState: "runState",
        operation: "operation",
        mode: "mode",
        remoteControlEnable: "remoteControlEnable",
        timer: "timer",
        detergent: "detergent",
        cycle: "cycle",
    };

    static _PROFILE: ProfileMap = {
        runState: { currentState: "currentState" },
        operation: { washerOperationMode: "washerOperationMode" },
        mode: {
            washerMode: "washerMode",
        },
        remoteControlEnable: { remoteControlEnabled: "remoteControlEnabled" },
        timer: {
            remainHour: "remainHour",
            remainMinute: "remainMinute",
            totalHour: "totalHour",
            totalMinute: "totalMinute",
            relativeHourToStop: "relativeHourToStop",
            relativeMinuteToStop: "relativeMinuteToStop",
            relativeHourToStart: "relativeHourToStart",
            relativeMinuteToStart: "relativeMinuteToStart",
        },
        detergent: { detergentSetting: "detergentSetting" },
        cycle: { cycleCount: "cycleCount" },
    };
    static _CUSTOM_PROPERTIES: CustomProperties = [];
    static _LOCATION_MAP: LocationMap = {};

    constructor(
        profile: Record<string, any>,
        locationName: string | null = null,
        useNotification = false,
    ) {
        super(
            profile,
            WashcomboProfile._RESOURCE_MAP,
            WashcomboProfile._PROFILE,
            WashcomboProfile._LOCATION_MAP,
            WashcomboProfile._CUSTOM_PROPERTIES,
            false,
            false,
            locationName,
            useNotification,
        );
        this._locationName = locationName;
    }

    generateProperties(property: Record<string, unknown>[]): void {
        if (Array.isArray(property)) {
            for (const locationProperty of property) {
                if (
                    _.get(locationProperty, "location.locationName") !==
                    this._locationName
                ) {
                    continue;
                }
                super.generateProperties(locationProperty);
            }
        } else {
            super.generateProperties(property);
        }
    }
}

export class WashcomboDevice extends WasherSubDevice {
    constructor(
        thinqApi: ThinQApi,
        deviceId: string,
        deviceType: string,
        modelName: string,
        alias: string,
        groupId: string,
        reportable: boolean,
        profile: Record<string, any>,
        location: string,
        energyProfile?: Record<string, unknown>,
    ) {
        super(
            new WashcomboProfile(profile, location, true),
            location,
            thinqApi,
            deviceId,
            deviceType,
            modelName,
            alias,
            reportable,
            undefined,
            energyProfile,
        );
        this._groupId = groupId;
        this._location = location;
    }

    get groupId(): string {
        return this._groupId;
    }

    set groupId(groupId: string) {
        this._groupId = groupId;
    }

    get location(): string {
        return this._location;
    }

    set location(location: string) {
        this._location = location;
    }

    setWasherOperationMode = async (
        operation: string,
    ): Promise<ThinQApiResponse> => {
        const payload = this.profiles.getEnumAttributePayload(
            "washerOperationMode",
            operation,
        );
        return await this._doAttributeCommand({
            location: { locationName: this._location },
            ...payload,
        });
    };

    setRelativeHourToStart = async (
        hour: number,
    ): Promise<ThinQApiResponse> => {
        const payload = this.profiles.getRangeAttributePayload(
            "relativeHourToStart",
            hour,
        );
        return await this._doAttributeCommand({
            location: { locationName: this._location },
            ...payload,
        });
    };

    setRelativeHourToStop = async (hour: number): Promise<ThinQApiResponse> => {
        const payload = this.profiles.getRangeAttributePayload(
            "relativeHourToStop",
            hour,
        );
        return await this._doAttributeCommand({
            location: { locationName: this._location },
            ...payload,
        });
    };

    setWasherMode = async (mode: string): Promise<ThinQApiResponse> => {
        const operationPayload = this.profiles.getEnumAttributePayload(
            "washerOperationMode",
            "START",
        );
        const payload = this.profiles.getEnumAttributePayload(
            "washerMode",
            mode,
        );
        return await this._doAttributeCommand({
            location: { locationName: this._location },
            ...operationPayload,
            ...payload,
        });
    };
}
