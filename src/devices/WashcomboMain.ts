/*
 * SPDX-FileCopyrightText: Copyright 2025 LG Electronics Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import _ from "lodash";
import { WashcomboDevice } from "./Washcombo";
import { ThinQApi } from "../ThinQAPI";

export class WashcomboMainDevice extends WashcomboDevice {
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
            groupId,
            reportable,
            profile,
            "MAIN",
            energyProfile,
        );
    }
}
