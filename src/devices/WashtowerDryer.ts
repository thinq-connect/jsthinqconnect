/*
 * SPDX-FileCopyrightText: Copyright 2025 LG Electronics Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import _ from "lodash";
import { DryerDevice } from "./Dryer";
import { ThinQApi } from "../ThinQAPI";

export class WashtowerDryerDevice extends DryerDevice {
    constructor(
        thinqApi: ThinQApi,
        deviceId: string,
        deviceType: string,
        modelName: string,
        alias: string,
        groupId: string,
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
            profile,
            energyProfile,
        );
        this._groupId = groupId;
    }

    get groupId(): string {
        return this._groupId;
    }

    set groupId(groupId: string) {
        this._groupId = groupId;
    }
}
