/*
 * SPDX-FileCopyrightText: Copyright 2025 LG Electronics Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

// Import constants from Const.ts
import {
    PROPERTY_READABLE,
    PROPERTY_WRITABLE,
    READABILITY,
    WRITABILITY,
    TYPE,
    UNIT,
    READABLE_VALUES,
    WRITABLE_VALUES,
} from "../Const";

export type DynamicObjectOrStringArray = Record<string, unknown> | string[];

export type DynamicObjectOrObjectArray =
    | Record<string, unknown>
    | Record<string, unknown>[];

export type PropertyValue = string | number | boolean | null;

export type DeviceStatus = Record<string, unknown>;

export type EnergyProfile = Record<string, unknown>;

export type Property = {
    [TYPE]: string;
    [READABILITY]: boolean;
    [WRITABILITY]: boolean;
    [UNIT]?: string;
    [READABLE_VALUES]?: DynamicObjectOrStringArray;
    [WRITABLE_VALUES]?: DynamicObjectOrStringArray;
    [key: string]: unknown; // Allow dynamic access
};

export type ProfileProperty = {
    [TYPE]: string;
    [PROPERTY_READABLE]: DynamicObjectOrStringArray | boolean;
    [PROPERTY_WRITABLE]: DynamicObjectOrStringArray | boolean;
    [UNIT]?: string;
};

export type AttributePayload = {
    [resource: string]: {
        [propKey: string]: string | number | boolean | null;
    };
};
