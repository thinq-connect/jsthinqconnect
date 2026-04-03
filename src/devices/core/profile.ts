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
} from "../../Const";
import {
    ProfileMap,
    ResourceMap,
    LocationMap,
    CustomProperties,
} from "../../types/Resources";
import {
    DynamicObjectOrObjectArray,
    DynamicObjectOrStringArray,
    Property,
    ProfileProperty,
    AttributePayload,
} from "../../types/Devices";

export type PropertyMode = "r" | "w";
export type PropertyType = "enum" | "range" | "list" | "string";
export type CustomResourcePropertiesHandler = (
    resourceKey: string,
    resourceProperty: DynamicObjectOrObjectArray,
    props: Record<string, string>,
    profile: ConnectDeviceProfile,
) => [string[], string[]];
export type CustomAttributePayloadHandler = (
    attribute: string,
    value: string | number | boolean,
    profile: ConnectDeviceProfile,
) => AttributePayload | undefined;
export type CustomAttributeWritableHandler = (
    propAttr: string,
    profile: ConnectDeviceProfile,
) => boolean | null;
export type ConnectDeviceProfileDefinition = {
    resourceMap: ResourceMap;
    profileMap: ProfileMap;
    locationMap?: LocationMap;
    customProperties?: CustomProperties;
    useExtensionProperty?: boolean;
    useSubProfileOnly?: boolean;
    locationName?: string | null;
    useNotification?: boolean;
    customResourcePropertiesHandler?: CustomResourcePropertiesHandler;
    customAttributePayloadHandler?: CustomAttributePayloadHandler;
    customAttributeWritableHandler?: CustomAttributeWritableHandler;
};

export const createConnectDeviceProfile = (
    profile: Record<string, DynamicObjectOrStringArray>,
    definition: ConnectDeviceProfileDefinition,
): ConnectDeviceProfile => {
    return new ConnectDeviceProfile(
        profile,
        definition.resourceMap,
        definition.profileMap,
        definition.locationMap || {},
        definition.customProperties || [],
        definition.useExtensionProperty || false,
        definition.useSubProfileOnly || false,
        definition.locationName ?? null,
        definition.useNotification ?? true,
        definition.customResourcePropertiesHandler,
        definition.customAttributePayloadHandler,
        definition.customAttributeWritableHandler,
    );
};

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
    public _customResourcePropertiesHandler?: CustomResourcePropertiesHandler;
    public _customAttributePayloadHandler?: CustomAttributePayloadHandler;
    public _customAttributeWritableHandler?: CustomAttributeWritableHandler;
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
        customResourcePropertiesHandler?: CustomResourcePropertiesHandler,
        customAttributePayloadHandler?: CustomAttributePayloadHandler,
        customAttributeWritableHandler?: CustomAttributeWritableHandler,
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
        this._customResourcePropertiesHandler = customResourcePropertiesHandler;
        this._customAttributePayloadHandler = customAttributePayloadHandler;
        this._customAttributeWritableHandler = customAttributeWritableHandler;

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

    _getPreferredPropertyKey(
        profile: Record<string, DynamicObjectOrStringArray>,
        resource: string,
        preferredKeys: string[],
    ): string {
        const resourceProperty = _.get(profile, ["property", resource], {});
        if (!_.isPlainObject(resourceProperty)) {
            return preferredKeys[preferredKeys.length - 1];
        }

        for (const key of preferredKeys) {
            if (Object.prototype.hasOwnProperty.call(resourceProperty, key)) {
                return key;
            }
        }

        return preferredKeys[preferredKeys.length - 1];
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
        if (this._customResourcePropertiesHandler) {
            return this._customResourcePropertiesHandler(
                resourceKey,
                resourceProperty,
                props,
                this,
            );
        }
        void resourceKey;
        void resourceProperty;
        void props;
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
        if (this._customAttributeWritableHandler) {
            const result = this._customAttributeWritableHandler(propAttr, this);
            if (typeof result === "boolean") return result;
        }
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
        if (this._customAttributePayloadHandler) {
            const payload = this._customAttributePayloadHandler(
                attribute,
                value,
                this,
            );
            if (payload) return payload;
        }
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
            throw new Error(`Not support ${attribute}: ${value}`);
        const payload = this._getAttributePayload(attribute, value);
        if (payload) return payload;
    }
}
