/*
 * SPDX-FileCopyrightText: Copyright 2025 LG Electronics Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import _ from "lodash";
import {
    ConnectBaseDevice,
    ConnectDeviceProfile,
    createConnectDeviceProfile,
} from "./ConnectDevice";
import {
    ResourceMap,
    ProfileMap,
    LocationMap,
    CustomProperties,
} from "../types/Resources";
import {
    DynamicObjectOrObjectArray,
    DynamicObjectOrStringArray,
} from "../types/Devices";
import { ThinQApi, ThinQApiResponse } from "../ThinQAPI";
import { DryerDevice, DryerProfile } from "./Dryer";
import { WasherSubDevice, WasherSubProfile } from "./Washer";

const WASH_TOWER_RESOURCE_MAP: ResourceMap = {};
const WASH_TOWER_PROFILE_MAP: ProfileMap = {};
const WASH_TOWER_LOCATION_MAP: LocationMap = {
    DRYER: "dryer",
    WASHER: "washer",
};
const WASH_TOWER_CUSTOM_PROPERTIES: CustomProperties = [];
type WashtowerPayloadKey = "washer" | "dryer";
type WashtowerSubProfiles = Record<WashtowerPayloadKey, ConnectDeviceProfile>;
type WashtowerSubDevices = {
    dryer: DryerDeviceSingle;
    washer: WasherDeviceSingle;
};
type WashtowerLocationProperties = Record<string, Record<string, string[]>>;
const WASH_TOWER_KEYS: WashtowerPayloadKey[] = ["dryer", "washer"];

const WASH_TOWER_PROFILE_DEFINITION = {
    resourceMap: WASH_TOWER_RESOURCE_MAP,
    profileMap: WASH_TOWER_PROFILE_MAP,
    locationMap: WASH_TOWER_LOCATION_MAP,
    customProperties: WASH_TOWER_CUSTOM_PROPERTIES,
    useSubProfileOnly: true,
};

const getWashtowerChildProfile = (
    profile: Record<string, DynamicObjectOrStringArray>,
    key: WashtowerPayloadKey,
): Record<string, DynamicObjectOrStringArray> => {
    return _.get(profile, key, {}) as Record<
        string,
        DynamicObjectOrStringArray
    >;
};

const createWashtowerSubProfiles = (
    profile: Record<string, DynamicObjectOrStringArray>,
): WashtowerSubProfiles => {
    return {
        washer: new WasherSubProfile(
            getWashtowerChildProfile(profile, "washer"),
            "WASHER",
            true,
        ),
        dryer: new DryerProfile(getWashtowerChildProfile(profile, "dryer")),
    };
};

const initializeWashtowerLocationProfiles = (
    mainProfile: ConnectDeviceProfile,
    subProfiles: WashtowerSubProfiles,
): void => {
    const locationProperties: WashtowerLocationProperties = {};
    for (const key of WASH_TOWER_KEYS) {
        const subProfile = subProfiles[key];
        mainProfile[key] = subProfile;
        locationProperties[key] = subProfile.properties;
    }
    mainProfile._locationProperties = locationProperties;
    mainProfile.generatePropertyMap();
};

const createWashtowerProfile = (
    profile: Record<string, DynamicObjectOrStringArray>,
): ConnectDeviceProfile => {
    const mainProfile = createConnectDeviceProfile(
        profile,
        WASH_TOWER_PROFILE_DEFINITION,
    );
    const subProfiles = createWashtowerSubProfiles(profile);
    initializeWashtowerLocationProfiles(mainProfile, subProfiles);
    return mainProfile;
};

const wrapWashtowerPayload = (
    key: WashtowerPayloadKey,
    payload: Record<string, unknown> | undefined,
): Record<string, unknown> => {
    return { [key]: { ...(payload || {}) } };
};

const executeWrappedWashtowerCommand = async (
    device: ConnectBaseDevice,
    key: WashtowerPayloadKey,
    payload: Record<string, unknown> | undefined,
): Promise<ThinQApiResponse> => {
    return await device._doAttributeCommand(wrapWashtowerPayload(key, payload));
};

const doWrappedEnumCommand = async (
    device: ConnectBaseDevice,
    key: WashtowerPayloadKey,
    attribute: string,
    value: string,
): Promise<ThinQApiResponse> => {
    const payload = device.profiles.getEnumAttributePayload(attribute, value);
    return await executeWrappedWashtowerCommand(device, key, payload);
};

const doWrappedRangeCommand = async (
    device: ConnectBaseDevice,
    key: WashtowerPayloadKey,
    attribute: string,
    value: number,
): Promise<ThinQApiResponse> => {
    const payload = device.profiles.getRangeAttributePayload(attribute, value);
    return await executeWrappedWashtowerCommand(device, key, payload);
};

const applyWashtowerStatus = (
    subDevice: ConnectBaseDevice,
    status: DynamicObjectOrObjectArray,
    isUpdated: boolean,
): void => {
    if (isUpdated) {
        subDevice.updateStatus(status);
        return;
    }
    subDevice.setStatus(status);
};

const fanOutWashtowerStatus = (
    status: Record<string, DynamicObjectOrObjectArray>,
    subDevices: WashtowerSubDevices,
    isUpdated = false,
): void => {
    for (const key of WASH_TOWER_KEYS) {
        applyWashtowerStatus(subDevices[key], _.get(status, key), isUpdated);
    }
};

class WasherDeviceSingle extends WasherSubDevice {
    setWasherOperationMode = async (
        operation: string,
    ): Promise<ThinQApiResponse> => {
        return await doWrappedEnumCommand(
            this,
            "washer",
            "washerOperationMode",
            operation,
        );
    };

    setRelativeHourToStart = async (
        hour: number,
    ): Promise<ThinQApiResponse> => {
        return await doWrappedRangeCommand(
            this,
            "washer",
            "relativeHourToStart",
            hour,
        );
    };

    setRelativeHourToStop = async (hour: number): Promise<ThinQApiResponse> => {
        return await doWrappedRangeCommand(
            this,
            "washer",
            "relativeHourToStop",
            hour,
        );
    };
}

class DryerDeviceSingle extends DryerDevice {
    async _doAttributeCommand(
        payload: Record<string, unknown>,
    ): Promise<ThinQApiResponse> {
        return await executeWrappedWashtowerCommand(this, "dryer", payload);
    }
}

const createWashtowerSubDevices = (
    profile: Record<string, DynamicObjectOrStringArray>,
    mainProfile: ConnectDeviceProfile,
    thinqApi: ThinQApi,
    deviceId: string,
    deviceType: string,
    modelName: string,
    alias: string,
    reportable: boolean,
    energyProfile?: Record<string, unknown>,
): WashtowerSubDevices => {
    const dryer = new DryerDeviceSingle(
        thinqApi,
        deviceId,
        deviceType,
        modelName,
        alias,
        reportable,
        getWashtowerChildProfile(profile, "dryer"),
        energyProfile,
    );
    const washerProfile = mainProfile.getSubProfile("washer");
    if (!washerProfile) {
        throw new Error("Washtower washer profile is required");
    }
    const washer = new WasherDeviceSingle(
        washerProfile,
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
    return { dryer, washer };
};

const registerWashtowerSubDevices = (
    mainDevice: WashtowerDevice,
    subDevices: WashtowerSubDevices,
): void => {
    mainDevice._subDevices = {};
    for (const key of WASH_TOWER_KEYS) {
        const subDevice = subDevices[key];
        mainDevice[key] = subDevice;
        mainDevice._subDevices[key] = subDevice;
    }
};

export class WashtowerDevice extends ConnectBaseDevice {
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
            createWashtowerProfile(profile),
            undefined,
            undefined,
            energyProfile,
        );
        const washtowerSubDevices = createWashtowerSubDevices(
            profile,
            this.profiles,
            thinqApi,
            deviceId,
            deviceType,
            modelName,
            alias,
            reportable,
            energyProfile,
        );
        registerWashtowerSubDevices(this, washtowerSubDevices);
    }

    setStatus(status: Record<string, DynamicObjectOrObjectArray>): void {
        super.setStatus(status);
        fanOutWashtowerStatus(status, this._subDevices as WashtowerSubDevices);
    }

    updateStatus(status: Record<string, DynamicObjectOrObjectArray>): void {
        super.updateStatus(status);
        fanOutWashtowerStatus(
            status,
            this._subDevices as WashtowerSubDevices,
            true,
        );
    }

    getSubDevice = (locationName: string): ConnectBaseDevice | null => {
        return super.getSubDevice(locationName);
    };
}
