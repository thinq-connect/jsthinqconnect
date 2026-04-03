![Local Image](https://www.lge.co.kr/kr/main/thinq/images/main/thinq_logo.png)

# Project Description

The thinqconnect provides a robust interface for interacting with the [LG ThinQ API](https://smartsolution.developer.lge.com/en/apiManage/thinq_connect?s=1734332700509) Open API.
This SDK is designed to facilitate seamless integration with a range of LGE appliances, bases on [LG ThinQ API](https://smartsolution.developer.lge.com/en/apiManage/thinq_connect?s=1734332700509).

# Notice

-   Since 2025, unofficial ThinQ projects—particularly reverse-engineered clients—may change without notice or become unavailable.

# Key Features

-   Profile Retrieval: Access detailed profiles of 27 different home appliances.
-   Device Management: Query and retrieve lists of connected devices and their statuses.
-   Device Control: Execute commands to control your appliances directly through the API.
-   Event Handling: Utilize AWS IoT Core for MQTT connections to receive device events and push notifications via callbacks.

This SDK is an essential tool for developers looking to integrate ThinQ Connect capabilities into their applications, ensuring efficient and reliable smart home management.

# Installation and usage

## Installation

```sh
npm install thinqconnect
```

## Usage

### Obtaining and Using a Personal Access Token

To use the ThinQ Connect NodeJS SDK, you need to obtain a Personal Access Token from the LG ThinQ Developer Site.
Follow the steps below to get your token and configure your environment.

Steps to Obtain a Personal Access Token

1. Sign Up or Log In:
    - Visit the [LG ThinQ Developer Site](https://smartsolution.developer.lge.com/en/apiManage/thinq_connect?s=1734332700509).
2. Navigate to Cloud Developer:
    - After logging in, go to the Cloud Developer section.
3. Navigate to Docs.
4. Locate ThinQ Connect:
    - Within the docs, find and select ThinQ Connect.
5. Generate Personal Access Token:
    - Under the ThinQ Connect section, locate PAT (Personal Access Token).
    - If you don’t have an account, sign up for one. If you already have an account, log in using your LG ThinQ Account.
    - Follow the instructions provided to generate and copy your Personal Access Token.

After obtaining your Personal Access Token, you need to configure your environment to use it with the SDK.

### Client ID Requirements

Each client device must use a unique Client ID. This Client ID should be a randomly generated value, and using a uuid4 format is recommended.
Be cautious with excessive client creation, as it may lead to your API calls being blocked.

```js
const { v4: uuidv4 } = require("uuid");
const CLIENT_ID = uuidv4();
```

### Country Codes

When initializing the SDK, you will also need to provide a country code.
Refer to the table below for the appropriate country code to use:
| **Country** | **Code** | **Country** | **Code** | **Country** | **Code** |
|:-----------:|:--------------------------------:|:-----------:|:-----------------------:|:-----------:|:--------------------------------:|
| AE | United Arab Emirates | GD | Grenada | NG | Nigeria |
| AF | Afghanistan | GE | Georgia | NI | Nicaragua |
| AG | Antigua and Barbuda | GH | Gana | NL | Netherlands |
| AL | Albania | GM | Gambia | NO | Norway |
| AM | Armenia | GN | Guinea | NP | Nepal |
| AO | Angola | GQ | Equatorial Guinea | NZ | New Zealand |
| AR | Argentina | GR | Greece | OM | Oman |
| AT | Austria | GT | Guatemala | PA | Panama |
| AU | Australia | GY | Guyana | PE | Peru |
| AW | Aruba | HK | Hong Kong | PH | Philippines |
| AZ | Azerbaijan | HN | Honduras | PK | Pakistan |
| BA | Bosnia and Herzegovina | HR | Croatia | PL | Poland |
| BB | Barbados | HT | Haiti | PR | Puerto Rico |
| BD | Bangladesh | HU | Hungary | PS | Occupied Palestinian Territory |
| BE | Belgium | ID | Indonesia | PT | Portugal |
| BF | Burkina Faso | IE | Ireland | PY | Paraguay |
| BG | Bulgaria | IL | Israel | QA | Qatar |
| BH | Bahrain | IN | India | RO | Romania |
| BJ | Benin | IQ | Iraq | RS | Serbia |
| BO | Bolivia | IR | Iran | RU | Russian Federation |
| BR | Brazil | IS | Iceland | RW | Rwanda |
| BS | Bahamas | IT | Italy | SA | Saudi Arabia |
| BY | Belarus | JM | Jamaica | SD | Sudan |
| BZ | Belize | JO | Jordan | SE | Sweden |
| CA | Canada | JP | Japan | SG | Singapore |
| CD | Democratic Republic of the Congo | KE | Kenya | SI | Slovenia |
| CF | Central African Republic | KG | Kyrgyzstan | SK | Slovakia |
| CG | Republic of the Congo | KH | Cambodia | SL | Sierra Leone |
| CH | Switzerland | KN | Saint Kitts and Nevis | SN | Senegal |
| CI | Republic of Ivory Coast | KR | Korea | SO | Somalia |
| CL | Chile | KW | Kuwait | SR | Suriname |
| CM | Cameroon | KZ | Kazakhstan | ST | Sao Tome and Principe |
| CN | China | LA | Laos | SV | El Salvador |
| CO | Colombia | LB | Lebanon | SY | Syrian Arab Republic |
| CR | Costa Rica | LC | Saint Lucia | TD | Chad |
| CU | Cuba | LK | Sri Lanka | TG | Togo |
| CV | Cape Verde | LR | Liberia | TH | Thailand |
| CY | Cyprus | LT | Lithuania | TN | Tunisia |
| CZ | Czech Republic | LU | Luxembourg | TR | Turkey |
| DE | Germany | LV | Latvia | TT | Trinidad and Tobago |
| DJ | Djibouti | LY | Libyan Arab Jamahiriya | TW | Taiwan |
| DK | Denmark | MA | Morocco | TZ | United Republic of Tanzania |
| DM | Dominica | MD | Republic of Moldova | UA | Ukraine |
| DO | Dominican Republic | ME | Montenegro | UG | Uganda |
| DZ | Algeria | MK | Macedonia | US | USA |
| EC | Ecuador | ML | Mali | UY | Uruguay |
| EE | Estonia | MM | Myanmar | UZ | Uzbekistan |
| EG | Egypt | MR | Mauritania | VC | Saint Vincent and the Grenadines |
| ES | Spain | MT | Malta | VE | Venezuela |
| ET | Ethiopia | MU | Mauritius | VN | Vietnam |
| FI | Finland | MW | Malawi | XK | Kosovo |
| FR | France | MX | Mexico | YE | Yemen |
| GA | Gabon | MY | Malaysia | ZA | South Africa |
| GB | United Kingdom | NE | Niger | ZM | Zambia |

### Simple Test

```js
const { ThinQApi } = require("thinqconnect");
const { v4: uuidv4 } = require("uuid");

// 1. Enter the Personal Access Token issued from the LG ThinQ Developer Site
const ACCESS_TOKEN = "your_personal_access_token";
// 2. Country code (e.g., Korea is 'KR')
const COUNTRY_CODE = "KR";
// 3. Client ID (generated with uuid4)
const CLIENT_ID = uuidv4();
// 4. Create ThinQApi instance
const api = new ThinQApi(ACCESS_TOKEN, COUNTRY_CODE, CLIENT_ID);
// 5. Test: Get device list
async function testGetDevices() {
    const response = await api.asyncGetDeviceList();
    if (response.status === 200) {
        console.log("Device list:", response.body);
    } else {
        console.error("Error:", response.errorCode, response.errorMessage);
    }
}
testGetDevices();
```

# License

Apache License

# Available Device Types and Properties

For detailed information on Device Properties, please refer to the following page: [LG ThinQ API - Device Profile](https://smartsolution.developer.lge.com/en/apiManage/device_profile?s=1734593490507)

### DEVICE_AIR_CONDITIONER

### Main

|     | resources         | properties                     |
| --- | ----------------- | ------------------------------ |
| 1   | airConJobMode     | currentJobMode                 |
| 2   | operation         | airConOperationMode            |
| 3   | operation         | airCleanOperationMode          |
| 4   | temperature       | currentTemperatureC            |
| 5   | temperature       | currentTemperatureF            |
| 6   | temperature       | targetTemperatureC             |
| 7   | temperature       | targetTemperatureF             |
| 8   | temperature       | minTargetTemperatureC          |
| 9   | temperature       | minTargetTemperatureF          |
| 10  | temperature       | maxTargetTemperatureC          |
| 11  | temperature       | maxTargetTemperatureF          |
| 12  | temperature       | heatTargetTemperatureC         |
| 13  | temperature       | heatTargetTemperatureF         |
| 14  | temperature       | coolTargetTemperatureC         |
| 15  | temperature       | coolTargetTemperatureF         |
| 16  | temperature       | autoTargetTemperatureC         |
| 17  | temperature       | autoTargetTemperatureF         |
| 18  | temperature       | temperatureUnit                |
| 19  | twoSetTemperature | twoSetEnabled                  |
| 20  | twoSetTemperature | twoSetHeatTargetTemperatureC   |
| 21  | twoSetTemperature | twoSetHeatTargetTemperatureF   |
| 22  | twoSetTemperature | twoSetCoolTargetTemperatureC   |
| 23  | twoSetTemperature | twoSetCoolTargetTemperatureF   |
| 24  | twoSetTemperature | twoSetTemperatureUnit          |
| 25  | timer             | relativeHourToStart            |
| 26  | timer             | relativeMinuteToStart          |
| 27  | timer             | relativeHourToStop             |
| 28  | timer             | relativeMinuteToStop           |
| 29  | timer             | absoluteHourToStart            |
| 30  | timer             | absoluteMinuteToStart          |
| 31  | timer             | absoluteHourToStop             |
| 32  | timer             | absoluteMinuteToStop           |
| 33  | sleepTimer        | sleepTimerRelativeHourToStop   |
| 34  | sleepTimer        | sleepTimerRelativeMinuteToStop |
| 35  | powerSave         | powerSaveEnabled               |
| 36  | airFlow           | windStrength                   |
| 37  | airFlow           | windStep                       |
| 38  | airQualitySensor  | pm1                            |
| 39  | airQualitySensor  | pm2                            |
| 40  | airQualitySensor  | pm10                           |
| 41  | airQualitySensor  | odor                           |
| 42  | airQualitySensor  | odorLevel                      |
| 43  | airQualitySensor  | humidity                       |
| 44  | airQualitySensor  | totalPollution                 |
| 45  | airQualitySensor  | totalPollutionLevel            |
| 46  | airQualitySensor  | monitoringEnabled              |
| 47  | filterInfo        | usedTime                       |
| 48  | filterInfo        | filterLifetime                 |
| 49  | filterInfo        | filterRemainPercent            |
| 50  | display           | displayLight                   |
| 51  | windDirection     | windRotateUpDown               |
| 52  | windDirection     | windRotateLeftRight            |

### DEVICE_AIR_PURIFIER

### Main

|     | resources          | properties                     |
| --- | ------------------ | ------------------------------ |
| 1   | airPurifierJobMode | currentJobMode                 |
| 2   | airPurifierJobMode | personalizationMode            |
| 3   | operation          | airPurifierOperationMode       |
| 4   | timer              | absoluteHourToStart            |
| 5   | timer              | absoluteMinuteToStart          |
| 6   | timer              | absoluteHourToStop             |
| 7   | timer              | absoluteMinuteToStop           |
| 8   | sleepTimer         | sleepTimerRelativeHourToStop   |
| 9   | sleepTimer         | sleepTimerRelativeMinuteToStop |
| 10  | airFlow            | windStrength                   |
| 11  | airQualitySensor   | monitoringEnabled              |
| 12  | airQualitySensor   | pm1                            |
| 13  | airQualitySensor   | pm1Level                       |
| 14  | airQualitySensor   | pm2                            |
| 15  | airQualitySensor   | pm2Level                       |
| 16  | airQualitySensor   | pm10                           |
| 17  | airQualitySensor   | pm10Level                      |
| 18  | airQualitySensor   | odor                           |
| 19  | airQualitySensor   | odorLevel                      |
| 20  | airQualitySensor   | humidity                       |
| 21  | airQualitySensor   | totalPollution                 |
| 22  | airQualitySensor   | totalPollutionLevel            |
| 23  | filterInfo         | filterRemainPercent            |
| 24  | filterInfo         | topFilterRemainPercent         |

### DEVICE_AIR_PURIFIER_FAN

### Main

|     | resources        | properties                     |
| --- | ---------------- | ------------------------------ |
| 1   | airFanJobMode    | currentJobMode                 |
| 2   | operation        | airFanOperationMode            |
| 3   | timer            | absoluteHourToStart            |
| 4   | timer            | absoluteMinuteToStart          |
| 5   | timer            | absoluteHourToStop             |
| 6   | timer            | absoluteMinuteToStop           |
| 7   | sleepTimer       | sleepTimerRelativeHourToStop   |
| 8   | sleepTimer       | sleepTimerRelativeMinuteToStop |
| 9   | airFlow          | warmMode                       |
| 10  | airFlow          | windTemperature                |
| 11  | airFlow          | windStrength                   |
| 12  | airFlow          | windAngle                      |
| 13  | airQualitySensor | monitoringEnabled              |
| 14  | airQualitySensor | pm1                            |
| 15  | airQualitySensor | pm2                            |
| 16  | airQualitySensor | pm10                           |
| 17  | airQualitySensor | humidity                       |
| 18  | airQualitySensor | temperature                    |
| 19  | airQualitySensor | odor                           |
| 20  | airQualitySensor | odorLevel                      |
| 21  | airQualitySensor | totalPollution                 |
| 22  | airQualitySensor | totalPollutionLevel            |
| 23  | display          | displayLight                   |
| 24  | misc             | uvNano                         |

### DEVICE_CEILING_FAN

### Main

|     | resources | properties              |
| --- | --------- | ----------------------- |
| 1   | airFlow   | windStrength            |
| 2   | operation | ceilingfanOperationMode |

### DEVICE_COOKTOP

### Main

|     | resources | properties    |
| --- | --------- | ------------- |
| 1   | operation | operationMode |

### Sub

|     | resources           | properties           |
| --- | ------------------- | -------------------- |
| 1   | cookingZone         | currentState         |
| 2   | power               | powerLevel           |
| 3   | remoteControlEnable | remoteControlEnabled |
| 4   | timer               | remainHour           |
| 5   | timer               | remainMinute         |

### DEVICE_DEHUMIDIFIER

### Main

|     | resources           | properties                |
| --- | ------------------- | ------------------------- |
| 1   | operation           | dehumidifierOperationMode |
| 2   | dehumidifierJobMode | currentJobMode            |
| 3   | humidity            | currentHumidity           |
| 4   | humidity            | targetHumidity            |
| 5   | airFlow             | windStrength              |

### DEVICE_DISH_WASHER

### Main

|     | resources           | properties               |
| --- | ------------------- | ------------------------ |
| 1   | runState            | currentState             |
| 2   | dishWashingStatus   | rinseRefill              |
| 3   | preference          | rinseLevel               |
| 4   | preference          | softeningLevel           |
| 5   | preference          | machineCleanReminder     |
| 6   | preference          | signalLevel              |
| 7   | preference          | cleanLightReminder       |
| 8   | doorStatus          | doorState                |
| 9   | operation           | dishWasherOperationMode  |
| 10  | remoteControlEnable | remoteControlEnabled     |
| 11  | timer               | relativeHourToStart      |
| 12  | timer               | relativeMinuteToStart    |
| 13  | timer               | remainHour               |
| 14  | timer               | remainMinute             |
| 15  | timer               | totalHour                |
| 16  | timer               | totalMinute              |
| 17  | dishWashingCourse   | currentDishWashingCourse |

### DEVICE_DRYER

### Main

|     | resources           | properties            |
| --- | ------------------- | --------------------- |
| 1   | runState            | currentState          |
| 2   | operation           | dryerOperationMode    |
| 3   | remoteControlEnable | remoteControlEnabled  |
| 4   | timer               | remainHour            |
| 5   | timer               | remainMinute          |
| 6   | timer               | totalHour             |
| 7   | timer               | totalMinute           |
| 8   | timer               | relativeHourToStop    |
| 9   | timer               | relativeMinuteToStop  |
| 10  | timer               | relativeHourToStart   |
| 11  | timer               | relativeMinuteToStart |

### DEVICE_HOME_BREW

### Main

|     | resources | properties      |
| --- | --------- | --------------- |
| 1   | runState  | currentState    |
| 2   | recipe    | beerRemain      |
| 3   | recipe    | flavorInfo      |
| 4   | recipe    | flavorCapsule1  |
| 5   | recipe    | flavorCapsule2  |
| 6   | recipe    | hopOilInfo      |
| 7   | recipe    | hopOilCapsule1  |
| 8   | recipe    | hopOilCapsule2  |
| 9   | recipe    | wortInfo        |
| 10  | recipe    | yeastInfo       |
| 11  | recipe    | recipeName      |
| 12  | timer     | elapsedDayState |
| 13  | timer     | elapsedDayTotal |

### DEVICE_HOOD

### Main

|     | resources   | properties        |
| --- | ----------- | ----------------- |
| 1   | ventilation | fanSpeed          |
| 2   | lamp        | lampBrightness    |
| 3   | operation   | hoodOperationMode |

### DEVICE_HUMIDIFIER

### Main

|     | resources         | properties                     |
| --- | ----------------- | ------------------------------ |
| 1   | humidifierJobMode | currentJobMode                 |
| 2   | operation         | humidifierOperationMode        |
| 3   | operation         | autoMode                       |
| 4   | operation         | sleepMode                      |
| 5   | operation         | hygieneDryMode                 |
| 6   | timer             | absoluteHourToStart            |
| 7   | timer             | absoluteHourToStop             |
| 8   | timer             | absoluteMinuteToStart          |
| 9   | timer             | absoluteMinuteToStop           |
| 10  | sleepTimer        | sleepTimerRelativeHourToStop   |
| 11  | sleepTimer        | sleepTimerRelativeMinuteToStop |
| 12  | humidity          | targetHumidity                 |
| 13  | humidity          | warmMode                       |
| 14  | airFlow           | windStrength                   |
| 15  | airQualitySensor  | monitoringEnabled              |
| 16  | airQualitySensor  | totalPollution                 |
| 17  | airQualitySensor  | totalPollutionLevel            |
| 18  | airQualitySensor  | pm1                            |
| 19  | airQualitySensor  | pm2                            |
| 20  | airQualitySensor  | pm10                           |
| 21  | airQualitySensor  | humidity                       |
| 22  | airQualitySensor  | temperature                    |
| 23  | display           | displayLight                   |
| 24  | moodLamp          | moodLampState                  |

### DEVICE_KIMCHI_REFRIGERATOR

### Main

|     | resources     | properties     |
| --- | ------------- | -------------- |
| 1   | refrigeration | oneTouchFilter |
| 2   | refrigeration | freshAirFilter |

### Sub

|     | resources   | properties        |
| --- | ----------- | ----------------- |
| 1   | temperature | targetTemperature |

### DEVICE_MICROWAVE_OVEN

### Main

|     | resources   | properties     |
| --- | ----------- | -------------- |
| 1   | runState    | currentState   |
| 2   | timer       | remainMinute   |
| 3   | timer       | remainSecond   |
| 4   | ventilation | fanSpeed       |
| 5   | lamp        | lampBrightness |

### DEVICE_OVEN

### Main

|     | resources | properties |
| --- | --------- | ---------- |
| 1   | info      | ovenType   |

### Sub

|     | resources           | properties           |
| --- | ------------------- | -------------------- |
| 1   | runState            | currentState         |
| 2   | operation           | ovenOperationMode    |
| 3   | cook                | cookMode             |
| 4   | remoteControlEnable | remoteControlEnabled |
| 5   | temperature         | targetTemperatureC   |
| 6   | temperature         | targetTemperatureF   |
| 7   | temperature         | temperatureUnit      |
| 8   | timer               | remainHour           |
| 9   | timer               | remainMinute         |
| 10  | timer               | remainSecond         |
| 11  | timer               | targetHour           |
| 12  | timer               | targetMinute         |
| 13  | timer               | targetSecond         |
| 14  | timer               | timerHour            |
| 15  | timer               | timerMinute          |
| 16  | timer               | timerSecond          |

### DEVICE_PLANT_CULTIVATOR

### Main

Empty

### Sub

|     | resources   | properties             |
| --- | ----------- | ---------------------- |
| 1   | runState    | currentState           |
| 2   | runState    | growthMode             |
| 3   | runState    | windVolume             |
| 4   | light       | brightness             |
| 5   | light       | duration               |
| 6   | light       | startHour              |
| 7   | light       | startMinute            |
| 8   | temperature | dayTargetTemperature   |
| 9   | temperature | nightTargetTemperature |
| 10  | temperature | temperatureState       |

### DEVICE_REFRIGERATOR

### Main

|     | resources       | properties                  |
| --- | --------------- | --------------------------- |
| 1   | powerSave       | powerSaveEnabled            |
| 2   | ecoFriendly     | ecoFriendlyMode             |
| 3   | sabbath         | sabbathMode                 |
| 4   | refrigeration   | rapidFreeze                 |
| 5   | refrigeration   | expressMode                 |
| 6   | refrigeration   | expressModeName             |
| 7   | refrigeration   | expressFridge               |
| 8   | refrigeration   | freshAirFilter              |
| 9   | refrigeration   | freshAirFilterRemainPercent |
| 10  | waterFilterInfo | usedTime                    |
| 11  | waterFilterInfo | waterFilterInfoUnit         |
| 12  | waterFilterInfo | waterFilterState            |
| 13  | waterFilterInfo | waterFilter1RemainPercent   |
| 14  | waterFilterInfo | waterFilter2RemainPercent   |
| 15  | waterFilterInfo | waterFilter3RemainPercent   |

### Sub

|     | resources   | properties         |
| --- | ----------- | ------------------ |
| 1   | doorStatus  | doorState          |
| 2   | temperature | targetTemperatureC |
| 3   | temperature | targetTemperatureF |
| 4   | temperature | temperatureUnit    |

### DEVICE_ROBOT_CLEANER

### Main

|     | resources           | properties            |
| --- | ------------------- | --------------------- |
| 1   | runState            | currentState          |
| 2   | robotCleanerJobMode | currentJobMode        |
| 3   | operation           | cleanOperationMode    |
| 4   | battery             | batteryLevel          |
| 5   | battery             | batteryPercent        |
| 6   | timer               | absoluteHourToStart   |
| 7   | timer               | absoluteMinuteToStart |
| 8   | timer               | runningHour           |
| 9   | timer               | runningMinute         |

### DEVICE_STICK_CLEANER

### Main

|     | resources           | properties     |
| --- | ------------------- | -------------- |
| 1   | runState            | currentState   |
| 2   | stickCleanerJobMode | currentJobMode |
| 3   | battery             | batteryLevel   |
| 4   | battery             | batteryPercent |

### DEVICE_STYLER

### Main

|     | resources           | properties           |
| --- | ------------------- | -------------------- |
| 1   | runState            | currentState         |
| 2   | operation           | stylerOperationMode  |
| 3   | remoteControlEnable | remoteControlEnabled |
| 4   | timer               | relativeHourToStop   |
| 5   | timer               | relativeMinuteToStop |
| 6   | timer               | remainHour           |
| 7   | timer               | remainMinute         |
| 8   | timer               | totalHour            |
| 9   | timer               | totalMinute          |

### DEVICE_SYSTEM_BOILER

### Main

|     | resources           | properties                      |
| --- | ------------------- | ------------------------------- |
| 1   | boilerJobMode       | currentJobMode                  |
| 2   | operation           | boilerOperationMode             |
| 3   | operation           | hotWaterMode                    |
| 4   | operation           | roomTempMode                    |
| 5   | operation           | roomWaterMode                   |
| 6   | hotWaterTemperature | hotWaterCurrentTemperatureC     |
| 7   | hotWaterTemperature | hotWaterCurrentTemperatureF     |
| 8   | hotWaterTemperature | hotWaterTargetTemperatureC      |
| 9   | hotWaterTemperature | hotWaterTargetTemperatureF      |
| 10  | hotWaterTemperature | hotWaterMaxTemperatureC         |
| 11  | hotWaterTemperature | hotWaterMaxTemperatureF         |
| 12  | hotWaterTemperature | hotWaterMinTemperatureC         |
| 13  | hotWaterTemperature | hotWaterMinTemperatureF         |
| 14  | hotWaterTemperature | hotWaterTemperatureUnit         |
| 15  | roomTemperature     | roomCurrentTemperatureC         |
| 16  | roomTemperature     | roomCurrentTemperatureF         |
| 17  | roomTemperature     | roomAirCurrentTemperatureC      |
| 18  | roomTemperature     | roomAirCurrentTemperatureF      |
| 19  | roomTemperature     | roomOutWaterCurrentTemperatureC |
| 20  | roomTemperature     | roomOutWaterCurrentTemperatureF |
| 21  | roomTemperature     | roomInWaterCurrentTemperatureC  |
| 22  | roomTemperature     | roomInWaterCurrentTemperatureF  |
| 23  | roomTemperature     | roomTargetTemperatureC          |
| 24  | roomTemperature     | roomTargetTemperatureF          |
| 25  | roomTemperature     | roomAirCoolTargetTemperatureC   |
| 26  | roomTemperature     | roomAirCoolTargetTemperatureF   |
| 27  | roomTemperature     | roomAirHeatTargetTemperatureC   |
| 28  | roomTemperature     | roomAirHeatTargetTemperatureF   |
| 29  | roomTemperature     | roomWaterCoolTargetTemperatureC |
| 30  | roomTemperature     | roomWaterCoolTargetTemperatureF |
| 31  | roomTemperature     | roomWaterHeatTargetTemperatureC |
| 32  | roomTemperature     | roomWaterHeatTargetTemperatureF |
| 33  | roomTemperature     | roomAirHeatMaxTemperatureC      |
| 34  | roomTemperature     | roomAirHeatMaxTemperatureF      |
| 35  | roomTemperature     | roomAirHeatMinTemperatureC      |
| 36  | roomTemperature     | roomAirHeatMinTemperatureF      |
| 37  | roomTemperature     | roomAirCoolMaxTemperatureC      |
| 38  | roomTemperature     | roomAirCoolMaxTemperatureF      |
| 39  | roomTemperature     | roomAirCoolMinTemperatureC      |
| 40  | roomTemperature     | roomAirCoolMinTemperatureF      |
| 41  | roomTemperature     | roomWaterHeatMaxTemperatureC    |
| 42  | roomTemperature     | roomWaterHeatMaxTemperatureF    |
| 43  | roomTemperature     | roomWaterHeatMinTemperatureC    |
| 44  | roomTemperature     | roomWaterHeatMinTemperatureF    |
| 45  | roomTemperature     | roomWaterCoolMaxTemperatureC    |
| 46  | roomTemperature     | roomWaterCoolMaxTemperatureF    |
| 47  | roomTemperature     | roomWaterCoolMinTemperatureC    |
| 48  | roomTemperature     | roomWaterCoolMinTemperatureF    |
| 49  | roomTemperature     | roomTemperatureUnit             |

### DEVICE_WASHER

### Main

Empty

### Sub

|     | resources           | properties            |
| --- | ------------------- | --------------------- |
| 1   | runState            | currentState          |
| 2   | operation           | washerOperationMode   |
| 3   | remoteControlEnable | remoteControlEnabled  |
| 4   | timer               | remainHour            |
| 5   | timer               | remainMinute          |
| 6   | timer               | totalHour             |
| 7   | timer               | totalMinute           |
| 8   | timer               | relativeHourToStop    |
| 9   | timer               | relativeMinuteToStop  |
| 10  | timer               | relativeHourToStart   |
| 11  | timer               | relativeMinuteToStart |
| 12  | detergent           | detergentSetting      |
| 13  | cycle               | cycleCount            |

### DEVICE_WATER_HEATER

### Main

|     | resources          | properties               |
| --- | ------------------ | ------------------------ |
| 1   | waterHeaterJobMode | currentJobMode           |
| 2   | operation          | waterHeaterOperationMode |
| 3   | temperature        | currentTemperatureC      |
| 4   | temperature        | currentTemperatureF      |
| 5   | temperature        | targetTemperatureC       |
| 6   | temperature        | targetTemperatureF       |
| 7   | temperature        | temperatureUnit          |

### DEVICE_WATER_PURIFIER

### Main

|     | resources | properties       |
| --- | --------- | ---------------- |
| 1   | runState  | cockState        |
| 2   | runState  | sterilizingState |
| 3   | waterInfo | waterType        |

### DEVICE_WINE_CELLAR

### Main

|     | resources | properties      |
| --- | --------- | --------------- |
| 1   | operation | lightBrightness |
| 2   | operation | optimalHumidity |
| 3   | operation | sabbathMode     |
| 4   | operation | lightStatus     |

### Sub

|     | resources   | properties         |
| --- | ----------- | ------------------ |
| 1   | temperature | targetTemperatureC |
| 2   | temperature | targetTemperatureF |
| 3   | temperature | temperatureUnit    |

### DEVICE_VENTILATOR

### Main

|     | resources         | properties                     |
| --- | ----------------- | ------------------------------ |
| 1   | ventilatorJobMode | currentJobMode                 |
| 2   | operation         | ventilatorOperationMode        |
| 3   | temperature       | currentTemperature             |
| 4   | temperature       | temperatureUnit                |
| 5   | airQualitySensor  | pm1                            |
| 6   | airQualitySensor  | pm2                            |
| 7   | airQualitySensor  | pm10                           |
| 8   | airQualitySensor  | co2                            |
| 9   | airFlow           | windStrength                   |
| 10  | timer             | absoluteHourToStop             |
| 11  | timer             | absoluteMinuteToStop           |
| 12  | timer             | absoluteHourToStart            |
| 13  | timer             | absoluteMinuteToStart          |
| 14  | timer             | relativeHourToStop             |
| 15  | timer             | relativeMinuteToStop           |
| 16  | timer             | relativeHourToStart            |
| 17  | timer             | relativeMinuteToStart          |
| 18  | sleepTimer        | sleepTimerRelativeHourToStop   |
| 19  | sleepTimer        | sleepTimerRelativeMinuteToStop |
