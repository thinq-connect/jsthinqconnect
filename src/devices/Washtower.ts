/*
 * SPDX-FileCopyrightText: Copyright 2025 LG Electronics Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import _ from "lodash";
import {
    ConnectBaseDevice,
    ConnectDeviceProfile,
    ConnectSubDevice,
} from "./ConnectDevice";
import {
    ResourceMap,
    ProfileMap,
    LocationMap,
    CustomProperties,
} from "../types/Resources";
import { DynamicObjectOrObjectArray } from "../types/Devices";
import { ThinQApi, ThinQApiResponse } from "../ThinQAPI";
import { DryerDevice, DryerProfile } from "./Dryer";
import { WasherSubDevice, WasherSubProfile } from "./Washer";

class WashTowerProfile extends ConnectDeviceProfile {
    static _RESOURCE_MAP: ResourceMap = {};
    static _PROFILE: ProfileMap = {};
    static _LOCATION_MAP: LocationMap = { DRYER: "dryer", WASHER: "washer" };
    static _CUSTOM_PROPERTIES: CustomProperties = [];
    constructor(profile: Record<string, any>) {
        super(
            profile,
            WashTowerProfile._RESOURCE_MAP,
            WashTowerProfile._PROFILE,
            WashTowerProfile._LOCATION_MAP,
            WashTowerProfile._CUSTOM_PROPERTIES,
            false,
            true,
        );
        const _locationProperties: Record<
            string,
            Record<string, string[]>
        > = {};
        for (const [locationName, attrKey] of _.toPairs(
            WashTowerProfile._LOCATION_MAP,
        )) {
            const _subProfile =
                locationName === "WASHER"
                    ? new WasherSubProfile(
                          _.get(profile, "washer", {}),
                          "WASHER",
                          true,
                      )
                    : new DryerProfile(_.get(profile, "dryer", {}));
            this[attrKey] = _subProfile;
            _locationProperties[attrKey] = _subProfile.properties;
        }
        this._locationProperties = _locationProperties;
        this.generatePropertyMap();
    }
}

class WasherDeviceSingle extends WasherSubDevice {
    setWasherOperationMode = async (
        operation: string,
    ): Promise<ThinQApiResponse> => {
        const payload = this.profiles.getEnumAttributePayload(
            "washerOperationMode",
            operation,
        );
        return await this._doAttributeCommand({ washer: { ...payload } });
    };

    setRelativeHourToStart = async (
        hour: number,
    ): Promise<ThinQApiResponse> => {
        const payload = this.profiles.getRangeAttributePayload(
            "relativeHourToStart",
            hour,
        );
        return await this._doAttributeCommand({ washer: { ...payload } });
    };

    setRelativeHourToStop = async (hour: number): Promise<ThinQApiResponse> => {
        const payload = this.profiles.getRangeAttributePayload(
            "relativeHourToStop",
            hour,
        );
        return await this._doAttributeCommand({ washer: { ...payload } });
    };
}

class DryerDeviceSingle extends DryerDevice {
    setDryerOperationMode = async (
        operation: string,
    ): Promise<ThinQApiResponse> => {
        const payload = this.profiles.getEnumAttributePayload(
            "dryerOperationMode",
            operation,
        );
        return await this._doAttributeCommand({ dryer: { ...payload } });
    };

    setRelativeHourToStart = async (
        hour: number,
    ): Promise<ThinQApiResponse> => {
        const payload = this.profiles.getRangeAttributePayload(
            "relativeHourToStart",
            hour,
        );
        return await this._doAttributeCommand({ dryer: { ...payload } });
    };

    setRelativeHourToStop = async (hour: number): Promise<ThinQApiResponse> => {
        const payload = this.profiles.getRangeAttributePayload(
            "relativeHourToStop",
            hour,
        );
        return await this._doAttributeCommand({ dryer: { ...payload } });
    };
}

export class WashtowerDevice extends ConnectBaseDevice {
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
            new WashTowerProfile(profile),
            undefined,
            undefined,
            energyProfile,
        );
        this._subDevices = {};
        this.dryer = new DryerDeviceSingle(
            thinqApi,
            deviceId,
            deviceType,
            modelName,
            alias,
            reportable,
            _.get(profile, "dryer", {}),
            energyProfile,
        );
        const washerDeviceSingle = this.profiles.getSubProfile("washer");
        if (washerDeviceSingle)
            this.washer = new WasherDeviceSingle(
                washerDeviceSingle,
                "",
                thinqApi,
                deviceId,
                deviceType,
                modelName,
                alias,
                reportable,
                true,
                energyProfile,
            );
        this._subDevices["dryer"] = this.dryer;
        this._subDevices["washer"] = this.washer;
    }

    setStatus(status: Record<string, DynamicObjectOrObjectArray>): void {
        super.setStatus(status);
        for (const [deviceType, subDevice] of _.toPairs(this._subDevices)) {
            subDevice.setStatus(_.get(status, deviceType));
        }
    }

    updateStatus(status: Record<string, DynamicObjectOrObjectArray>): void {
        super.updateStatus(status);
        for (const [deviceType, subDevice] of _.toPairs(this._subDevices)) {
            subDevice.updateStatus(_.get(status, deviceType));
        }
    }

    getSubDevice = (locationName: string): ConnectSubDevice | null => {
        return super.getSubDevice(locationName);
    };
}
