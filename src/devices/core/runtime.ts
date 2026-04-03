/*
 * SPDX-FileCopyrightText: Copyright 2025 LG Electronics Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import * as _ from "lodash";
import { BaseDevice } from "../../Device";
import { ThinQApi, ThinQApiResponse } from "../../ThinQAPI";
import {
    DynamicObjectOrObjectArray,
    DeviceStatus,
    EnergyProfile,
} from "../../types/Devices";
import { USAGE_DAILY, USAGE_MONTHLY } from "../../Const";
import { ConnectDeviceProfile } from "./profile";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type SubDeviceConstructor = new (...args: any[]) => ConnectSubDevice;
export type CustomStatusResourceHandler = (
    propKey: string,
    attribute: string,
    resourceStatus: DynamicObjectOrObjectArray,
    isUpdated: boolean,
    device: ConnectBaseDevice,
) => boolean | null;

export class ConnectBaseDevice extends BaseDevice {
    public _CUSTOM_SET_PROPERTY_NAME: Record<string, string>;
    public _profiles: ConnectDeviceProfile;
    public _subDevices: { [key: string]: ConnectBaseDevice };
    public _energyProfiles: EnergyProfile;
    public _energyProperties: Record<string, unknown>[] = [];
    public _customStatusResourceHandler?: CustomStatusResourceHandler;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;

    constructor(
        thinqApi: ThinQApi,
        deviceId: string,
        deviceType: string,
        modelName: string,
        alias: string,
        reportable: boolean,
        profiles: ConnectDeviceProfile,
        customSetPropertyName?: Record<string, string>,
        subDeviceType?: SubDeviceConstructor,
        energyProfiles?: EnergyProfile,
        customStatusResourceHandler?: CustomStatusResourceHandler,
    ) {
        super(thinqApi, deviceId, deviceType, modelName, alias, reportable);
        this._CUSTOM_SET_PROPERTY_NAME = customSetPropertyName || {};
        this._profiles = profiles;
        this._energyProfiles = energyProfiles || {};
        this._subDevices = {};
        this._customStatusResourceHandler = customStatusResourceHandler;

        if (subDeviceType) {
            for (const locationName of this.profiles.locations) {
                const subProfile = this.profiles.getSubProfile(locationName);
                const locationKey = this.profiles.getLocationKey(locationName);
                if (!subProfile || !locationKey) continue;
                const _subDevice = new subDeviceType(
                    subProfile,
                    locationKey,
                    thinqApi,
                    deviceId,
                    deviceType,
                    modelName,
                    alias,
                    reportable,
                );
                (this as Record<string, unknown>)[locationName] = _subDevice;
                this._subDevices[locationName] = _subDevice;
            }
        }

        if (energyProfiles) {
            this._energyProperties = _.get(
                energyProfiles,
                "result.property",
                [],
            ) as Record<string, unknown>[];
        }
    }

    get profiles(): ConnectDeviceProfile {
        return this._profiles;
    }

    _getDateTypeInstance(dateStr: string): [string | null, Date | null] {
        let dateType: string;

        if (dateStr.length === 8) {
            dateType = USAGE_DAILY;
        } else if (dateStr.length === 6) {
            dateType = USAGE_MONTHLY;
        } else {
            return [null, null];
        }
        if (!/^\d+$/.test(dateStr)) {
            return [null, null];
        }

        const year = parseInt(dateStr.substring(0, 4), 10);
        const month = parseInt(dateStr.substring(4, 6), 10) - 1;
        const day =
            dateType === USAGE_DAILY
                ? parseInt(dateStr.substring(6, 8), 10)
                : 1;

        try {
            const date = new Date(year, month, day);
            if (isNaN(date.getTime())) {
                return [null, null];
            }
            return [dateType, date];
        } catch (error) {
            return [null, null];
        }
    }

    _checkDateFormat(period: string, startDate: string, endDate: string): void {
        const [sPeriod, sDate] = this._getDateTypeInstance(startDate);
        const [ePeriod, eDate] = this._getDateTypeInstance(endDate);

        if (!sPeriod || !sDate) {
            throw new Error(`Invalid start date ${startDate}`);
        }
        if (!ePeriod || !eDate) {
            throw new Error(`Invalid end date ${endDate}`);
        }
        if (period !== sPeriod) {
            throw new Error(
                `Invalid start date ${startDate} in period ${period}`,
            );
        }
        if (period !== ePeriod) {
            throw new Error(`Invalid end date ${endDate} in period ${period}`);
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (eDate > today) {
            throw new Error(`Invalid end date ${endDate}`);
        }
        if (eDate < sDate) {
            throw new Error(`Invalid date period ${startDate} - ${endDate}`);
        }
    }

    _checkValidEnergyProperty(energyProperty: string) {
        if (
            this._energyProperties &&
            energyProperty in this._energyProperties
        ) {
            throw new Error(
                `Energy Property is not supported: ${energyProperty} ${JSON.stringify(
                    this._energyProperties,
                )}`,
            );
        }
    }

    async _getEnergyPropertyUsage(
        energyProperty: string,
        period: string,
        startDate: string,
        endDate: string,
    ) {
        this._checkValidEnergyProperty(energyProperty);
        this._checkDateFormat(period, startDate, endDate);
        return await this.thinqApi.asyncGetDeviceEnergyUsage(
            this.deviceId,
            energyProperty,
            period,
            startDate,
            endDate,
        );
    }

    async getMonthlyEnergyUsage(
        energyProperty: string,
        startDate: string,
        endDate: string,
    ) {
        return await this._getEnergyPropertyUsage(
            energyProperty,
            USAGE_MONTHLY,
            startDate,
            endDate,
        );
    }

    async getDailyEnergyUsage(
        energyProperty: string,
        startDate: string,
        endDate: string,
    ) {
        return await this._getEnergyPropertyUsage(
            energyProperty,
            USAGE_DAILY,
            startDate,
            endDate,
        );
    }

    getPropertyKey(resource: string, originKey: string): string | null {
        const resourceProfiles = _.get(
            this.profiles.getProfile(),
            resource,
            {},
        ) as Record<string, string>;
        const propKey = _.get(resourceProfiles, originKey);
        return propKey ? `${propKey}` : null;
    }

    __returnExistFunName(funName: string): string | null {
        const fn = (this as Record<string, unknown>)[funName];
        return typeof fn === "function" ? funName : null;
    }

    _snakeToCamel(str: string): string {
        return _.upperFirst(
            str.replace(/([-_][a-z])/gi, ($1) => {
                return $1.toUpperCase().replace("-", "").replace("_", "");
            }),
        );
    }

    getPropertySetFn(propertyName: string): string | null {
        return Object.prototype.hasOwnProperty.call(
            this._CUSTOM_SET_PROPERTY_NAME,
            propertyName,
        )
            ? this.__returnExistFunName(
                  `set${this._snakeToCamel(
                      this._CUSTOM_SET_PROPERTY_NAME[propertyName],
                  )}Property`,
              )
            : this.__returnExistFunName(
                  `set${this._snakeToCamel(propertyName)}`,
              );
    }

    getSubDevice(locationName: string): ConnectBaseDevice | null {
        return this._profiles.locations.includes(locationName)
            ? this._subDevices[locationName]
            : null;
    }

    _setCustomResources(
        propKey: string,
        attribute: string,
        resourceStatus: DynamicObjectOrObjectArray,
        isUpdated = false,
    ): boolean | null {
        if (this._customStatusResourceHandler) {
            return this._customStatusResourceHandler(
                propKey,
                attribute,
                resourceStatus,
                isUpdated,
                this,
            );
        }
        void propKey;
        void attribute;
        void resourceStatus;
        void isUpdated;
        return null;
    }

    __setPropertyStatus(
        resourceStatus: DynamicObjectOrObjectArray,
        resource: string,
        propKey: string,
        propAttr: string,
        isUpdated = false,
    ): void {
        if (propAttr === "locationName") return;
        let value: unknown = null;

        if (resourceStatus !== null && resourceStatus !== undefined) {
            if (this.profiles._CUSTOM_PROPERTIES.includes(resource)) {
                if (
                    this._setCustomResources(
                        propKey,
                        propAttr,
                        resourceStatus,
                        isUpdated,
                    )
                ) {
                    return;
                }
            }
            if (_.isPlainObject(resourceStatus)) {
                value = _.get(resourceStatus, propKey, null);
            }
            if (isUpdated) {
                if (
                    typeof resourceStatus === "object" &&
                    resourceStatus !== null &&
                    propKey in resourceStatus
                ) {
                    this._setStatusAttr(propAttr, value);
                }
                return;
            }
        }
        this._setStatusAttr(propAttr, value);
    }

    _setStatusAttr(propAttr: string, value: unknown): void {
        (this as Record<string, unknown>)[propAttr] = value;
    }

    __setErrorStatus(status: Record<string, unknown>): void {
        if (this.profiles.error)
            this._setStatusAttr("error", _.get(status, "error", null));
    }

    __setStatus(status: Record<string, unknown>): void {
        for (const [resource, props] of Object.entries(
            this.profiles.getProfile(),
        )) {
            const resourceStatus = _.get(status, resource) as
                | Record<string, unknown>
                | Record<string, unknown>[];
            const resourceProps: [string, string][] = Object.entries(props);
            for (const [propKey, propAttr] of resourceProps) {
                this.__setPropertyStatus(
                    resourceStatus,
                    resource,
                    propKey,
                    propAttr,
                );
            }
        }
    }

    __updateStatus(status: Record<string, unknown>): void {
        const deviceProfile = this.profiles.getProfile();
        for (const [resource, resourceStatus] of Object.entries(status)) {
            const resourceProps: [string, string][] = Object.entries(
                deviceProfile[resource] || {},
            );
            if (!(resource in deviceProfile)) continue;
            for (const [propKey, propAttr] of resourceProps) {
                this.__setPropertyStatus(
                    resourceStatus as DynamicObjectOrObjectArray,
                    resource,
                    propKey,
                    propAttr,
                    true,
                );
            }
        }
    }

    _setStatus(
        status: DynamicObjectOrObjectArray,
        isUpdated = false,
    ): null | undefined {
        if (!_.isPlainObject(status)) return null;
        this.__setErrorStatus(status as Record<string, unknown>);
        if (isUpdated) this.__updateStatus(status as Record<string, unknown>);
        else this.__setStatus(status as Record<string, unknown>);
    }

    getStatus(propertyName: string): unknown {
        const status = (this as Record<string, unknown>)[propertyName];
        return status !== null &&
            (propertyName === "error" ||
                this.profiles.checkAttributeReadable(propertyName))
            ? status
            : null;
    }

    setStatus(status: DynamicObjectOrObjectArray): void {
        this._setStatus(status);
    }

    updateStatus(status: DynamicObjectOrObjectArray): void {
        this._setStatus(status, true);
    }

    async _doAttributeCommand(
        payload: Record<string, unknown>,
    ): Promise<ThinQApiResponse> {
        return await this.thinqApi.asyncPostDeviceControl(
            this.deviceId,
            payload,
        );
    }

    async doAttributeCommand(
        attribute: string,
        value: number | boolean,
    ): Promise<ThinQApiResponse | undefined> {
        const payload = this.profiles.getAttributePayload(
            attribute,
            value as number | boolean,
        );
        if (payload) return await this._doAttributeCommand(payload);
    }

    async doMultiAttributeCommand(
        attributes: Record<string, unknown>,
    ): Promise<ThinQApiResponse> {
        const payload: Record<string, unknown> = {};
        for (const [attr, value] of Object.entries(attributes)) {
            const attrPayload = this.profiles.getAttributePayload(
                attr,
                value as number | boolean,
            );
            if (!attrPayload) continue;
            Object.entries(attrPayload).forEach(([key, subDict]) => {
                if (
                    typeof payload[key] === "object" &&
                    payload[key] !== null &&
                    typeof subDict === "object" &&
                    subDict !== null
                ) {
                    payload[key] = {
                        ...(payload[key] as object),
                        ...(subDict as object),
                    };
                } else {
                    payload[key] = subDict;
                }
            });
        }
        return await this._doAttributeCommand(payload);
    }

    async doRangeAttributeCommand(
        attribute: string,
        value: number,
    ): Promise<ThinQApiResponse | undefined> {
        if (typeof value !== "number") return;
        const payload = this.profiles.getRangeAttributePayload(
            attribute,
            value,
        );
        if (payload) return await this._doAttributeCommand(payload);
    }

    async doMultiRangeAttributeCommand(
        attributes: Record<string, unknown>,
    ): Promise<ThinQApiResponse> {
        const payload: Record<string, unknown> = {};
        for (const [attr, value] of Object.entries(attributes)) {
            if (typeof value !== "number") continue;
            const attrPayload = this.profiles.getRangeAttributePayload(
                attr,
                value as number,
            );
            if (!attrPayload) continue;
            Object.entries(attrPayload).forEach(([key, subDict]) => {
                if (
                    typeof payload[key] === "object" &&
                    payload[key] !== null &&
                    typeof subDict === "object" &&
                    subDict !== null
                ) {
                    payload[key] = {
                        ...(payload[key] as object),
                        ...(subDict as object),
                    };
                } else {
                    payload[key] = subDict;
                }
            });
        }
        return await this._doAttributeCommand(payload);
    }

    async doEnumAttributeCommand(
        attribute: string,
        value: string,
    ): Promise<ThinQApiResponse | undefined> {
        const payload = this.profiles.getEnumAttributePayload(attribute, value);
        if (payload) return await this._doAttributeCommand(payload);
    }
}

export class ConnectMainDevice extends ConnectBaseDevice {
    constructor(
        thinqApi: ThinQApi,
        deviceId: string,
        deviceType: string,
        modelName: string,
        alias: string,
        reportable: boolean,
        profiles: ConnectDeviceProfile,
        subDeviceType: SubDeviceConstructor,
        energyProfile?: EnergyProfile,
    ) {
        super(
            thinqApi,
            deviceId,
            deviceType,
            modelName,
            alias,
            reportable,
            profiles,
            {},
            subDeviceType,
            energyProfile,
            undefined,
        );
    }

    setStatus(status: DeviceStatus[]): void {
        super.setStatus(status);
        const subDevices: [string, ConnectBaseDevice][] = _.toPairs(
            this._subDevices,
        );
        for (const [, subDevice] of subDevices) {
            subDevice.setStatus(status);
        }
    }

    updateStatus(status: DeviceStatus[]): void {
        super.updateStatus(status);
        const subDevices: [string, ConnectBaseDevice][] = _.toPairs(
            this._subDevices,
        );
        for (const [, subDevice] of subDevices) {
            subDevice.updateStatus(status);
        }
    }
}

export class ConnectSubDevice extends ConnectBaseDevice {
    public _locationName: string;
    public _isSingleResource: boolean;

    constructor(
        profiles: ConnectDeviceProfile,
        locationName: string,
        thinqApi: ThinQApi,
        deviceId: string,
        deviceType: string,
        modelName: string,
        alias: string,
        reportable: boolean,
        isSingleResource = false,
        customSetPropertyName?: Record<string, string>,
        energyProfile?: EnergyProfile,
    ) {
        super(
            thinqApi,
            deviceId,
            deviceType,
            modelName,
            alias,
            reportable,
            profiles,
            customSetPropertyName,
            undefined,
            energyProfile,
            undefined,
        );
        this._locationName = locationName;
        this._isSingleResource = isSingleResource;
    }

    get locationName(): string {
        return this._locationName;
    }

    _getLocationNameFromStatus(
        locationStatus: Record<string, unknown>,
    ): string | undefined {
        if (this._isSingleResource)
            return _.get(locationStatus, "locationName") as string | undefined;
        else
            return _.get(locationStatus, "location.locationName") as
                | string
                | undefined;
    }

    _isCurrentLocationStatus(locationStatus: Record<string, unknown>): boolean {
        return (
            this._getLocationNameFromStatus(locationStatus) ===
            this._locationName
        );
    }

    _setStatus(
        status: DynamicObjectOrObjectArray,
        isUpdated = false,
    ): null | undefined {
        if (Array.isArray(status)) {
            for (const locationStatus of status) {
                if (!this._isCurrentLocationStatus(locationStatus)) continue;
                super._setStatus(locationStatus, isUpdated);
                return null;
            }
            return null;
        }
        for (const resource of this.profiles._CUSTOM_PROPERTIES) {
            for (const locationStatus of _.get(status, resource, []) as Record<
                string,
                unknown
            >[]) {
                if (!this._isCurrentLocationStatus(locationStatus)) continue;
                super._setStatus({ [resource]: locationStatus }, isUpdated);
                return null;
            }
        }
    }

    _setBaseStatus(
        status: DynamicObjectOrObjectArray,
        isUpdated = false,
    ): void {
        super._setStatus(status, isUpdated);
    }
}
