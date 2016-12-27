import React, {Component, PropTypes} from 'react';
import {
    View,
    Text,
    ListView,
    RefreshControl,
    StyleSheet,
    TouchableHighlight,
    AsyncStorage,
    TextInput,
    Image,
    WebView
} from 'react-native';
import I18n from '../constants/Messages';
import ApiClient from '../utils/ApiClient';
import ServiceCommons from '../utils/ServiceCommons';
import MapButton from '../components/MapButton';
import {OfflineView, SearchBar, SearchFilterButton} from '../components';
import {connect} from 'react-redux';
import {Icon} from '../components';
import InfiniteScrollView from 'react-native-infinite-scroll-view';
import {Regions, Services} from '../data';
import styles, {themes, getUnderlayColor, getFontFamily, getRowOrdering, getAlignItems} from '../styles';
import {wrapHtmlContent} from '../utils/htmlUtils'

var _ = require('underscore');


export class Notifications extends Component {
    render() {
        const {language, theme, region} = this.props;
        if (!region) {
            return <View />;
        }
        let html = region.banners.map((banner) => `<div class="banner">${banner.html}</div>`).join('<br />');
        let source = {
            html: wrapHtmlContent(html, language, '', theme)
        };
        return (
            <View style={styles.container}>
                <WebView source={source} />
            </View>
        );
    }
}

function mapStateToProps(state) {
    return {
        theme: state.theme,
        language: state.language,
        region: state.region
    }
}

export default connect(mapStateToProps)(Notifications);