/*
 * SPDX-FileCopyrightText: Copyright 2025 LG Electronics Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import * as _ from "lodash";
import {
    PROPERTY_READABLE,
    PROPERTY_WRITABLE,
    READABILITY,
    WRITABILITY,
    TYPE,
    UNIT,
    READABLE_VALUES,
    WRITABLE_VALUES,
    USAGE_MONTHLY,
    USAGE_DAILY,
} from "../Const";
import {
    ProfileMap,
    ResourceMap,
    LocationMap,
    CustomProperties,
} from "../types/Resources";
import { BaseDevice } from "../Device";
import { ThinQApi, ThinQApiResponse } from "../ThinQAPI";
import {
    DynamicObjectOrObjectArray,
    DynamicObjectOrStringArray,
    Property,
    ProfileProperty,
    AttributePayload,
    DeviceStatus,
    EnergyProfile,
} from "../types/Devices";

export type PropertyMode = "r" | "w";
export type PropertyType = "enum" | "range" | "list" | "string";
export type SubDeviceConstructor = new (...args: any[]) => ConnectSubDevice;
export { READABILITY, WRITABILITY } from "../Const";

export class ConnectDeviceProfile {
    public _RESOURCE_MAP: ResourceMap;
    public _LOCATION_MAP: LocationMap;
    public _PROFILE: ProfileMap;
    public _CUSTOM_PROPERTIES: CustomProperties;
    public _properties: Record<string, string[]>;
    public _propertyMap: Record<string, ProfileProperty>;
    public _locationProperties: Record<string, Record<string, string[]>>;
    public _error: Property | null;
    public _notification: Property | null;
    public _locationName: string | null;
    [key: string]: DynamicObjectOrStringArray | unknown;

    constructor(
        profile: Record<string, DynamicObjectOrStringArray>,
        resourceMap?: ResourceMap,
        profileMap?: ProfileMap,
        locationMap?: LocationMap,
        customProperties?: CustomProperties,
        useExtensionProperty = false,
        useSubProfileOnly = false,
        locationName: string | null = null,
        useNotification = true,
    ) {
        this._RESOURCE_MAP = resourceMap || {};
        this._LOCATION_MAP = locationMap || {};
        this._PROFILE = profileMap || {};
        this._CUSTOM_PROPERTIES = customProperties || [];
        this._properties = {};
        this._propertyMap = {};
        this._locationProperties = {};
        this._error = null;
        this._notification = null;
        this._locationName = locationName;

        this.generateNotification(
            useNotification
                ? (_.get(profile, "notification") as Record<string, string[]>)
                : undefined,
        );

        if (!useSubProfileOnly) {
            this.generateError(_.get(profile, "error") as string[] | undefined);
            this.generateProperties(
                _.get(
                    profile,
                    !useExtensionProperty ? "property" : "extensionProperty",
                ) as DynamicObjectOrObjectArray | undefined,
            );
            this.generatePropertyMap();
        } else {
            this._error = null;
        }
    }

    _safeGet(
        data: Record<string, DynamicObjectOrStringArray>,
        key: string,
    ): DynamicObjectOrStringArray {
        return _.get(data, key);
    }

    __getReadOnlyStringProperty(value: string): Property {
        return {
            [TYPE]: "string",
            [READABILITY]: true,
            [WRITABILITY]: false,
            [READABLE_VALUES]: [value],
            [WRITABLE_VALUES]: [],
        };
    }

    _getReadOnlyEnumProperty(value: string[]): Property {
        return {
            [TYPE]: "enum",
            [READABILITY]: true,
            [WRITABILITY]: false,
            [READABLE_VALUES]: value,
            [WRITABLE_VALUES]: [],
        };
    }

    _isReadableProperty(property: DynamicObjectOrStringArray): boolean {
        return (
            !_.isPlainObject(property) ||
            _.includes(
                _.get(property, "mode", []) as DynamicObjectOrStringArray,
                "r",
            )
        );
    }

    _isWritableProperty(property: DynamicObjectOrStringArray): boolean {
        return (
            _.isPlainObject(property) &&
            _.includes(
                _.get(property, "mode", []) as DynamicObjectOrStringArray,
                "w",
            )
        );
    }

    _getProperties(
        resourceProperty: Record<string, DynamicObjectOrStringArray>,
        key: string,
    ): Property {
        const _property = _.get(resourceProperty, key, {});
        if (_.isString(_property))
            return this.__getReadOnlyStringProperty(_property);
        const _propertyType = _.get(_property, [TYPE]) as string;
        const _propertyUnit =
            _.get(_property, [UNIT]) || _.get(resourceProperty, [UNIT]);
        const prop: Property = {
            [TYPE]: _propertyType,
            [READABILITY]: !!this._isReadableProperty(_property),
            [WRITABILITY]: !!this._isWritableProperty(_property),
            ...(_propertyUnit ? { [UNIT]: _propertyUnit } : {}),
        };

        if (
            _.isPlainObject(_property) &&
            _.includes(["enum", "range", "list"], _propertyType)
        ) {
            prop[READABLE_VALUES] = prop[READABILITY]
                ? this._safeGet(
                      resourceProperty,
                      `${key}.value.${PROPERTY_READABLE}`,
                  )
                : _propertyType === "range"
                ? {}
                : [];
            prop[WRITABLE_VALUES] = prop[WRITABILITY]
                ? this._safeGet(
                      resourceProperty,
                      `${key}.value.${PROPERTY_WRITABLE}`,
                  )
                : _propertyType === "range"
                ? {}
                : [];
        }

        return prop;
    }

    get properties(): Record<string, string[]> {
        return this._properties;
    }

    get locationProperties(): Record<string, Record<string, string[]>> {
        return this._locationProperties;
    }

    get propertyMap(): Record<string, ProfileProperty> {
        return this._propertyMap;
    }

    get writableProperties(): string[] {
        let writableProps: string[] = [];
        for (const prop in this._properties) {
            const propObj = this[prop] as { w?: string[] };
            writableProps = _.concat(writableProps, propObj?.w ?? []);
        }
        return writableProps;
    }

    get notification(): ProfileProperty | null {
        return this._notification
            ? this._convertPropertyToProfile(this._notification)
            : null;
    }

    get error(): ProfileProperty | null {
        return this._error ? this._convertPropertyToProfile(this._error) : null;
    }

    get locations(): string[] {
        return _.keys(this._locationProperties);
    }

    _convertPropertyToProfile(prop: Property): ProfileProperty {
        if (_.get(prop, READABLE_VALUES) || _.get(prop, WRITABLE_VALUES)) {
            return {
                [TYPE]: prop[TYPE],
                [PROPERTY_READABLE]: prop[READABLE_VALUES] as
                    | DynamicObjectOrStringArray
                    | boolean,
                [PROPERTY_WRITABLE]: prop[WRITABLE_VALUES] as
                    | DynamicObjectOrStringArray
                    | boolean,
                ...(_.get(prop, UNIT) ? { [UNIT]: prop[UNIT] as string } : {}),
            };
        }
        return {
            [TYPE]: prop[TYPE],
            [PROPERTY_READABLE]: prop[READABILITY],
            [PROPERTY_WRITABLE]: prop[WRITABILITY],
        };
    }

    getSubProfile(locationName: string): ConnectDeviceProfile | null {
        if (_.includes(this.locations, locationName)) {
            return this[locationName] as ConnectDeviceProfile;
        } else {
            return null;
        }
    }

    getLocationKey(locationName: string): string | undefined {
        for (const [key, value] of _.toPairs(this._LOCATION_MAP)) {
            if (value === locationName) {
                return key;
            }
        }
    }

    _getPropAttr(key: string): Property {
        return this[`__${key}`] as Property;
    }

    _setResourceProps(
        resource: string,
        props: Record<PropertyMode, string[]> | null,
    ): void {
        if (_.has(this, resource)) {
            const oldProps = this[resource] as Record<PropertyMode, string[]>;
            if (oldProps && props) {
                for (const mode of ["r", "w"] as PropertyMode[]) {
                    props[mode] = _.concat(oldProps[mode], props[mode]);
                }
            } else if (oldProps) {
                props = oldProps;
            }
        }
        this[resource] = props;
    }

    _setPropAttr(key: string, value: Property): void {
        this[`__${key}`] = value;
    }

    getProperty(propertyName: string): ProfileProperty {
        const _prop = this._getPropAttr(propertyName) as Property;
        return this._convertPropertyToProfile(_prop);
    }

    getProfile(): ProfileMap {
        return this._PROFILE;
    }

    generateError(error: string[] | undefined): void {
        this._error = error ? this._getReadOnlyEnumProperty(error) : null;
    }

    generateNotification(
        notification: Record<string, string[]> | undefined,
    ): void {
        const notificationPush = _.get(notification, "push");
        this._notification = notificationPush
            ? this._getReadOnlyEnumProperty(notificationPush)
            : null;
    }

    _generateCustomResourceProperties(
        resourceKey: string,
        resourceProperty: DynamicObjectOrObjectArray,
        props: Record<string, string>,
    ): [string[], string[]] {
        const readableProps: string[] = [];
        const writableProps: string[] = [];
        return [readableProps, writableProps];
    }

    _generateResourceProperties(
        resourceProperty: Record<string, DynamicObjectOrStringArray>,
        props: Record<string, string>,
    ): [string[], string[]] {
        const readableProps: string[] = [];
        const writableProps: string[] = [];

        for (const [propKey, propAttr] of Object.entries(props)) {
            const prop = this._getProperties(resourceProperty, propKey);
            if (prop[READABILITY]) {
                readableProps.push(propAttr);
            }
            if (prop[WRITABILITY]) {
                writableProps.push(propAttr);
            }
            this._setPropAttr(propAttr, prop);
        }
        return [readableProps, writableProps];
    }

    generateProperties(property: DynamicObjectOrObjectArray | undefined): void {
        const _properties: Record<string, string[]> = {};
        for (const [resource, props] of Object.entries(this._PROFILE)) {
            const resourceProperty = _.get(property, resource, {});
            let _readable: string[] | null = null;
            let _writable: string[] | null = null;
            if (
                !_.isNil(resourceProperty) &&
                !(
                    _.isEmpty(resourceProperty) &&
                    (_.isObject(resourceProperty) ||
                        _.isArray(resourceProperty))
                )
            ) {
                if (_.includes(this._CUSTOM_PROPERTIES, resource)) {
                    [_readable, _writable] =
                        this._generateCustomResourceProperties(
                            resource,
                            resourceProperty as DynamicObjectOrObjectArray,
                            props,
                        );
                } else if (_.isPlainObject(resourceProperty)) {
                    [_readable, _writable] = this._generateResourceProperties(
                        resourceProperty as Record<
                            string,
                            DynamicObjectOrStringArray
                        >,
                        props,
                    );
                }
                const readableList = _readable || [];
                const writableList = _writable || [];
                if (!(_.isEmpty(readableList) && _.isEmpty(writableList)))
                    _properties[this._RESOURCE_MAP[resource]] = _.concat(
                        _.get(_properties, this._RESOURCE_MAP[resource], []),
                        _.uniq(_.concat(readableList, writableList)),
                    );
                this._setResourceProps(this._RESOURCE_MAP[resource], {
                    r: _readable ?? [],
                    w: _writable ?? [],
                });
            } else {
                this._setResourceProps(this._RESOURCE_MAP[resource], null);
                for (const propAttr of Object.values(props)) {
                    this._setPropAttr(propAttr, {
                        [READABILITY]: false,
                        [WRITABILITY]: false,
                        [TYPE]: "",
                    } as Property);
                }
            }
        }
        this._properties = _properties;
    }

    generatePropertyMap(): void {
        this._propertyMap = {};
        for (const props of Object.values(this._properties)) {
            for (const prop of props) {
                this._propertyMap[prop] = this.getProperty(prop);
            }
        }
        if (this.notification)
            this._propertyMap["notification"] = this.notification;
        if (this.error) this._propertyMap["error"] = this.error;
    }

    checkAttributeReadable(propAttr: string): boolean {
        const val = this._getPropAttr(propAttr)[READABILITY];
        if (typeof val === "boolean") return val;
        return false;
    }

    checkAttributeWritable(propAttr: string): boolean {
        const val = this._getPropAttr(propAttr)[WRITABILITY];
        if (typeof val === "boolean") return val;
        return false;
    }

    checkRangeAttributeWritable(propAttr: string, value: number): boolean {
        const values = this._getPropAttr(propAttr)[WRITABLE_VALUES];
        if (!values || typeof values !== "object") return false;
        const vMin = _.get(values, "min", 1) as number;
        const vMax = _.get(values, "max", 1) as number;
        const vStep = _.get(values, "step", 1) as number;
        const vExcept = _.get(values, "except", []) as number[];
        return (
            vMin <= value &&
            value <= vMax &&
            (value - vMin) % vStep === 0 &&
            !_.includes(vExcept, value)
        );
    }

    checkEnumAttributeWritable(
        propAttr: string,
        value: string | boolean,
    ): boolean {
        const writableValues = this._getPropAttr(propAttr)[WRITABLE_VALUES];
        if (!Array.isArray(writableValues)) return false;
        return !!writableValues && _.includes(writableValues, value);
    }

    _getAttributePayload(
        attribute: string,
        value: string | number | boolean,
    ): AttributePayload | undefined {
        for (const [resource, props] of Object.entries(this._PROFILE)) {
            for (const [propKey, propAttr] of Object.entries(props)) {
                if (propAttr === attribute) {
                    return {
                        [resource]: {
                            [propKey]: value,
                        },
                    };
                }
            }
        }
    }

    getAttributePayload(
        attribute: string,
        value: number | boolean,
    ): AttributePayload | undefined {
        if (!this.checkAttributeWritable(attribute))
            throw new Error(`Not support ${attribute}`);
        return this._getAttributePayload(attribute, value);
    }

    getRangeAttributePayload(
        attribute: string,
        value: number,
    ): AttributePayload | undefined {
        if (!this.checkRangeAttributeWritable(attribute, value))
            throw new Error(`Not support ${attribute}: ${value}`);
        const payload = this._getAttributePayload(attribute, value);
        if (payload) return payload;
    }

    getEnumAttributePayload(
        attribute: string,
        value: string,
    ): AttributePayload | undefined {
        if (!this.checkEnumAttributeWritable(attribute, value))
            throw new Error(`Not support ${attribute}`);
        return this._getAttributePayload(attribute, value);
    }
}

export class ConnectBaseDevice extends BaseDevice {
    public _CUSTOM_SET_PROPERTY_NAME: Record<string, string>;
    public _profiles: ConnectDeviceProfile;
    public _subDevices: { [key: string]: ConnectSubDevice };
    public _energyProfiles: EnergyProfile;
    public _energyProperties: Record<string, unknown>[] = [];

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
    ) {
        super(thinqApi, deviceId, deviceType, modelName, alias, reportable);
        this._CUSTOM_SET_PROPERTY_NAME = customSetPropertyName || {};
        this._profiles = profiles;
        this._energyProfiles = energyProfiles || {};
        this._subDevices = {};

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
        const month = parseInt(dateStr.substring(4, 6), 10) - 1; // JavaScript months are 0-indexed
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

    getSubDevice(locationName: string): ConnectSubDevice | null {
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
        return (this as any)[propertyName] !== null &&
            (propertyName === "error" ||
                this.profiles.checkAttributeReadable(propertyName))
            ? (this as Record<string, unknown>)[propertyName]
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
        );
    }

    setStatus(status: DeviceStatus[]): void {
        super.setStatus(status);
        const subDevices: [string, ConnectSubDevice][] = _.toPairs(
            this._subDevices,
        );
        for (const [_, subDevice] of subDevices) {
            subDevice.setStatus(status);
        }
    }

    updateStatus(status: DeviceStatus[]): void {
        super.updateStatus(status);
        const subDevices: [string, ConnectSubDevice][] = _.toPairs(
            this._subDevices,
        );
        for (const [_, subDevice] of subDevices) {
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
