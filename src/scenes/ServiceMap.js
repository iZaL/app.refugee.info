import React, {Component, PropTypes} from 'react';
import {
    View,
    ListView,
    StyleSheet,
    AsyncStorage,
    Image,
    Text,
    Dimensions,
    Platform,
    LayoutAnimation
} from 'react-native';
import MapView from 'react-native-maps';
import styles, {
    themes,
} from '../styles';
import I18n from '../constants/Messages';
import ServiceCommons from '../utils/ServiceCommons';
import {connect} from 'react-redux';
import {
    MapPopup,
    Button,
    SearchBar,
    SearchFilterButton,
    SelectableListItem,
    LoadingOverlay,
    Icon
} from '../components';
import {Regions, Services} from '../data';

var _ = require('underscore');
var {width, height} = Dimensions.get('window');

const RADIUS_MULTIPLIER = 1.2;

class ServiceMap extends Component {

    static propTypes = {
        searchCriteria: React.PropTypes.string
    };

    static contextTypes = {
        navigator: PropTypes.object.isRequired
    };

    markers = [];

    static getInitialRegion(region) {
        if (!region || !region.envelope) {
            return null;
        }

        let lats = region.envelope.coordinates[0].map(c => c[1]), longs = region.envelope.coordinates[0].map(c => c[0]);
        let minLat = Math.min.apply(null, lats), minLong = Math.min.apply(null, longs);
        let maxLat = Math.max.apply(null, lats), maxLong = Math.max.apply(null, longs);

        return {
            latitude: (minLat + maxLat) / 2,
            longitude: (minLong + maxLong) / 2,
            latitudeDelta: (maxLat - minLat) * RADIUS_MULTIPLIER,
            longitudeDelta: (maxLong - minLong) * RADIUS_MULTIPLIER
        };
    }


    constructor(props) {
        super(props);
        if (props.hasOwnProperty('savedState') && props.savedState) {
            this.state = props.savedState;
        } else {
            this.state = {
                dataSource: new ListView.DataSource({
                    rowHasChanged: (row1, row2) => row1.id !== row2.id
                }),
                markers: [],
                filteringView: false,
                searchCriteria: '',
                initialEnvelope: null,
                loading: false
            };
        }
        this.icons = {};
        this.serviceCommons = new ServiceCommons();
    }

    componentWillUpdate() {
        // animations on Android causes markers to stop rendering
        Platform.OS === 'ios' && LayoutAnimation.easeInEaseOut();
    }

    componentDidMount() {
        const {region, searchCriteria, serviceTypes} = this.props;
        let currentEnvelope = ServiceMap.getInitialRegion(region);
        this.setState({
            initialEnvelope: currentEnvelope,
            searchCriteria: searchCriteria,
            serviceTypes: serviceTypes
        }, () => {
            this.fetchData(currentEnvelope).done();
        });
    }

    onCalloutPress(marker) {
        let service = marker.service;
        let location = this.state.locations.find(function (loc) {
            return loc.id == service.region;
        });
        let serviceType = this.state.serviceTypes.find(function (type) {
            return type.url == service.type;
        });
        const {navigator} = this.context;
        navigator.forward(null, null, {service, location, serviceType}, this.state);
    }

    async fetchData(envelope = {}) {
        this.setState({
            loading: true
        });
        const {region, theme} = this.props;
        const criteria = this.state.searchCriteria;
        const serviceData = new Services(this.props);

        let currentEnvelope = envelope;
        if (!region) {
            return;
        }
        try {
            let serviceTypes = null;
            if (this.state.serviceTypes) {
                serviceTypes = this.state.serviceTypes
            } else {
                serviceTypes = await serviceData.listServiceTypes();
                for (let i = 0; i < serviceTypes.length; i++) {
                    serviceTypes[i].active = false
                }
            }
            let types = this.getServiceTypeNumbers(serviceTypes);
            let serviceResult = await serviceData.pageServices(
                region.slug,
                currentEnvelope,
                criteria,
                1,
                100,
                types
            );
            let services = serviceResult.results;
            services = _.uniq(services, false, (s) => s.id);
            let markers = services.map(service => {
                let serviceType = serviceTypes.find(function (type) {
                    return type.url == service.type;
                });

                let iconName = (serviceType.vector_icon || '').trim();
                let widget = null;
                if (iconName) {
                    widget = (
                        <View
                            style={{
                                flex: 1,
                                flexDirection: 'row',
                                paddingLeft: 2,
                                width: 36,
                                height: 36,
                                backgroundColor: themes.light.greenAccentColor,
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderColor: themes[theme].backgroundColor,
                                borderRadius: 10,
                                borderWidth: 1
                            }}
                        >
                            <Icon
                                name={iconName}
                                style={{
                                    fontSize: 24,
                                    color: themes.dark.textColor,
                                    textAlign: 'center',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            />
                        </View>);
                } else {
                    widget = (
                        <Image
                            source={{uri: serviceType.icon_url}}
                            style={styles.mapIcon}
                        />);
                }

                return {
                    latitude: service.location.coordinates[1],
                    longitude: service.location.coordinates[0],
                    description: service.description,
                    title: service.name,
                    widget,
                    service,
                };
            });

            this.setState({
                serviceTypes,
                locations: [region],
                searchCriteria: criteria,
                markers,
                region,
                services,
                serviceTypeDataSource: this.state.dataSource.cloneWithRows(serviceTypes),
                loading: false
            });
        } catch (e) {
            console.log(e);
            this.setState({
                loading: false
            });
        }
    }

    toggleServiceType(type) {
        let serviceTypes = this.state.serviceTypes;
        let index = serviceTypes.findIndex((obj) => {
            return obj.number === type.number
        });
        serviceTypes[index].active = !serviceTypes[index].active;
        this.setState({
            serviceTypeDataSource: this.state.dataSource.cloneWithRows(serviceTypes)
        })
    }

    renderServiceTypeRow(type) {
        return (
            <SelectableListItem
                text={type.name}
                fontSize={13}
                onPress={this.toggleServiceType.bind(this, type) }
                selected={type.active}
            />
        );
    }

    filterByText(event) {
        if (this.state.region) {
            this.setState({
                searchCriteria: event.nativeEvent.text,
                filteringView: false
            }, () => {
                this.fetchData(this.state.initialEnvelope).done()
            });
        }
    }

    searchFilterButtonAction() {
        requestAnimationFrame(() => {
            if (this.state.region) {
                this.setState({
                    filteringView: !this.state.filteringView
                });
            }
        })
    }

    clearFilters() {

        let serviceTypes = this.state.serviceTypes;
        for (let i = 0; i < serviceTypes.length; i++) {
            serviceTypes[i].active = false;
        }
        this.setState({
            serviceTypes: serviceTypes,
            serviceTypeDataSource: this.state.dataSource.cloneWithRows(serviceTypes)
        }, () => {
            this.fetchData(this.state.initialEnvelope).then(() =>
                this.setState({
                    filteringView: false
                })
            );
        });
    }

    getServiceTypeNumbers(serviceTypes) {
        let types = [];
        for (let i = 0; i < serviceTypes.length; i++) {
            if (serviceTypes[i].active) {
                types.push(serviceTypes[i].number)
            }
        }
        return types.join()
    }

    filterByTypes() {
        this.fetchData(this.state.initialEnvelope).then(() =>
            this.setState({
                filteringView: false
            })
        )
    }

    render() {
        const {theme} = this.props;
        let {filteringView, loading} = this.state;

        this.markers = this.state.markers.map(() => null);
        return (
            <View style={styles.container}>
                <MapView
                    initialRegion={this.state.initialEnvelope}
                    style={styles.flex}
                    showsUserLocation={true}
                    showsMyLocationButton={false}
                    showsPointsOfInterest={false}
                    showsCompass={false}
                >
                    {this.state.markers.map((marker, i) => (
                        <MapView.Marker
                            coordinate={{
                                latitude: marker.latitude,
                                longitude: marker.longitude
                            }}
                            description={marker.description}
                            key={i}
                            ref={(r) => this.markers[i] = r}
                            onCalloutPress={() => this.onCalloutPress(marker)}
                        >
                            {marker.widget}
                            <MapView.Callout tooltip={true} style={[{
                                width: width - 50
                            }]}>
                                <MapPopup marker={marker}/>
                            </MapView.Callout>
                        </MapView.Marker>
                    ))}
                </MapView>
                <View
                    style={[
                        styles.row, {
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            height: 46,
                            width: width
                        }
                    ]}
                >
                    <SearchBar
                        theme={theme}
                        floating={!filteringView}
                        initialSearchText={this.props.searchCriteria}
                        searchFunction={(text) => this.filterByText(text) }
                    />
                    <SearchFilterButton
                        theme={theme}
                        floating={!filteringView}
                        onPressAction={() => this.searchFilterButtonAction() }
                        active={filteringView}
                    />
                </View>
                {filteringView && (
                    <View
                        style={[
                            theme == 'dark' ? styles.searchBarContainerDark : styles.searchBarContainerLight, {
                                flex: 1,
                                position: 'absolute',
                                top: 46,
                                left: 0,
                                width: width,
                                height: height - 46 - 80
                            }
                        ]}
                    >
                        <View
                            style={[
                                styles.searchBarContainer,
                                theme == 'dark' ? styles.searchBarContainerDark : styles.searchBarContainerLight
                            ]}
                        >
                            <Button
                                color="green"
                                icon="md-close"
                                text={I18n.t('CLEAR_FILTERS').toUpperCase() }
                                style={{flex: 1, marginRight: 2, marginBottom: 0}}
                                onPress={this.clearFilters.bind(this) }
                                buttonStyle={{height: 33}}
                                textStyle={{fontSize: 12}}
                                iconStyle={Platform.OS === 'ios' ? {top: 2} : {}}
                            />
                            <Button
                                color="green"
                                icon="md-funnel"
                                text={I18n.t('FILTER_SERVICES').toUpperCase() }
                                style={{flex: 1, marginLeft: 2, marginBottom: 0}}
                                onPress={this.filterByTypes.bind(this) }
                                buttonStyle={{height: 33}}
                                textStyle={{fontSize: 12}}
                            />
                        </View>
                        <ListView
                            dataSource={this.state.serviceTypeDataSource}
                            renderRow={(type) => this.renderServiceTypeRow(type) }
                            keyboardShouldPersistTaps={true}
                            keyboardDismissMode="on-drag"
                            direction={this.props.direction}
                        />
                    </View>
                ) }
                {loading && <LoadingOverlay theme={theme} height={height - 80} width={width}/>}
            </View>
        );

    }
}

const mapStateToProps = (state) => {
    return {
        country: state.country,
        region: state.region,
        theme: state.theme,
        direction: state.direction
    };
};

export default connect(mapStateToProps)(ServiceMap);
