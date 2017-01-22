import {Component} from 'react';
import {
    AsyncStorage,
    Platform
} from 'react-native';
import ApiClient from '../utils/ApiClient';
import store from '../store';
let DeviceInfo = require('react-native-device-info');

export default class Presence extends Component {

    static async getToken() {
        return await AsyncStorage.getItem('notificationToken');
    }

    static pointFromDeviceCoords(c) {
        return {
            coordinates: [
                c.longitude,
                c.latitude
            ],
            type: 'Point'
        };
    }

    static async registerToken(token) {
        await AsyncStorage.setItem('notificationToken', JSON.stringify(token));
    }

    static async registerLocation(deviceCoords) {
        let currentLocation = Presence.pointFromDeviceCoords(deviceCoords);
        await AsyncStorage.setItem('deviceCoordinates', JSON.stringify(currentLocation));
    }

    static async getLocation() {
        return JSON.parse(await AsyncStorage.getItem('deviceCoordinates'));
    }

    constructor(props, context = null) {
        super();

        this.client = new ApiClient(context, props);
    }

    async recordPresence(region, language) {
        let token = await Presence.getToken();
        const location = await Presence.getLocation();
        const {navigation} = store.getState();

        token = JSON.parse(token) || {};
        token.platform = {
            version: Platform.Version,
            os: Platform.OS
        };
        token.path = navigation;

        try {
            let deviceId = DeviceInfo.getUniqueID();
            if (deviceId) {
                token.deviceId = deviceId;
            }
        } catch(e) {

        }
        token = JSON.stringify(token);


        let payload = {
            coordinates: location ? location : (region ? region.centroid : null),
            region: region ? region.id : null,
            language,
            token
        };

        let promise = Promise.resolve(true);
        await this.client.post('presence/', payload)
            .then(() => promise)
            .catch(() => promise);

        await promise;
    }
}