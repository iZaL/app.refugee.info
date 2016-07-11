import React, {Component, PropTypes} from 'react';
import {
    AsyncStorage,
} from 'react-native';
import I18n from '../constants/Messages';
import {MapButton, OfflineView, DirectionalText, SearchBar} from '../components';
import {connect} from 'react-redux';
import ApiClient from '../utils/ApiClient';
import styles from '../styles';
import store from '../store';
import Icon from 'react-native-vector-icons/Ionicons';

export default class Presence extends Component {
    constructor(props, context = null) {
        super();

        this.client = new ApiClient(context, props);
    }

    static pointFromDeviceCoords(c) {
        return {
            coordinates: [
                c.longitude, // x
                c.latitude, // x
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
    
    static async getToken(deviceCoords) {
        return await AsyncStorage.getItem('notificationToken');
    }
    
    async recordPresence(region) {
        const token = await Presence.getToken();
        const location = await Presence.getLocation();
        
        let payload = {
            coordinates: location ? location : (region ? region.centroid : null),
            region: region ? region.id : null,
            token
        };

        await this.client.post('/v1/presence/', payload);
    }
}