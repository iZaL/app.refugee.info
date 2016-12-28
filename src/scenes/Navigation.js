import React, {
    Component,
    PropTypes
} from 'react';
import {
    Text,
    Image,
    View,
    ScrollView,
    StyleSheet,
    Linking
} from 'react-native';
import {connect} from 'react-redux';
import I18n from '../constants/Messages';
import DrawerCommons from '../utils/DrawerCommons';
import {MenuSection, MenuItem} from '../components';
import {
    updateRegionIntoStorage,
    updateCountryIntoStorage
} from '../actions';
import {Icon} from '../components';
import {
    getFontFamily,
    getRowOrdering,
    themes
} from '../styles';
import {LIKE_PATH, FEEDBACK_MAP} from '../constants';


class Navigation extends Component {

    static contextTypes = {
        drawer: PropTypes.object.isRequired,
        navigator: PropTypes.object
    };

    constructor(props) {
        super(props);
        this.drawerCommons = new DrawerCommons(this);
    }

    _defaultOrFirst(section, showTitle = false) {
        this.drawerCommons.closeDrawer();
        if (section.html && section.content.length == 1) {
            return this.context.navigator.to('infoDetails', null, {
                slug: section.slug || `info${section.index}`,
                section: section.content[0].section,
                sectionTitle: section.pageTitle,
                showTitle,
                index: section.content[0].index,
                content_slug: section.slug
            });
        } else {
            let payload = {
                region: section.type != 'info' ? section : null,
                information: section.type == 'info' ? null : section
            };
            return this.context.navigator.to('info', null, payload);
        }
    }

    async selectCity(city) {
        const {dispatch, country} = this.props;
        city.country = country;

        dispatch(updateRegionIntoStorage(city));
        dispatch(updateCountryIntoStorage(city.country));
        dispatch({type: 'REGION_CHANGED', payload: city});
        dispatch({type: 'COUNTRY_CHANGED', payload: city.country});

        return this._defaultOrFirst(city);
    }

    navigateToImportantInformation(item) {
        this.drawerCommons.closeDrawer();
        return this.context.navigator.to('infoDetails', null, {
            sectionTitle: item.title,
            section: item.html,
            slug: item.slug || `info${item.index}`,
            content_slug: item.slug,
            showTitle: true
        });
    }

    getImportantInformation() {
        const {route, region} = this.props;
        const {navigator} = this.context;
        if (!region || !region.important) {
            return;
        }
        return region.important.map((item, index) => {
            return (
                <MenuItem
                    active={route === 'infoDetails' && navigator.currentRoute.props.slug == item.slug}
                    icon={item.icon}
                    key={index}
                    onPress={() => this.navigateToImportantInformation(item)}
                >
                    {item.title}
                </MenuItem>
            );
        });
    }

    getImportantInformationSection() {
        let importantInformationItems = this.getImportantInformation();
        if (importantInformationItems) {
            return (
                <MenuSection title={I18n.t('IMPORTANT_INFORMATION')}>
                    {importantInformationItems}
                </MenuSection>
            );
        }

    }

    getNearbyCities() {
        const {locations, region} = this.props;
        if (locations) {
            return locations.map((i, index) => {
                return (
                    <MenuItem
                        active={i.id == region.id}
                        key={index}
                        onPress={() => this.selectCity(i)}
                    >
                        {i.pageTitle || i.name}
                    </MenuItem>
                );
            });
        }
    }

    getNearbyCitiesSection() {
        let nearbyCitiesItems = this.getNearbyCities();
        if (nearbyCitiesItems) {
            return (
                <MenuSection title={I18n.t('CHANGE_LOCATION')}>
                    {nearbyCitiesItems}
                </MenuSection>
            );
        }
    }

    render() {
        const {route, direction, language, region} = this.props;
        const {navigator} = this.context;

        if (!this.props.region) {
            return;
        }

        let feedbackUrl = (FEEDBACK_MAP[language] || FEEDBACK_MAP.en) + (region && region.slug);
        const aboutUs = region.important_information && region.important_information.find(a => a.slug === 'about-us');

        let importantInformationSection = this.getImportantInformationSection();
        let nearbyCitiesSection = this.getNearbyCitiesSection();

        let logo = themes.light.drawerLogo;
        let styles = lightNavigationStyles;

        let bannerCount = region.banners && region.banners.length;
        let regionName = region.name ? region.name.toUpperCase() : '';

        // Shorthand to change scene
        let s = (scene) => this.drawerCommons.changeScene(scene);

        return (
            <ScrollView style={styles.view}>
                <View style={[styles.logoContainer, getRowOrdering(direction)]}>
                    <Image
                        source={logo}
                        style={styles.logo}
                    />
                </View>

                <View style={[styles.titleWrapper, getRowOrdering(direction)]}>
                    <Icon
                        name="md-locate"
                        style={[
                            {fontSize: 20, color: themes.light.greenAccentColor, marginTop: 2},
                            (direction == 'ltr' ? {marginRight: 10} : {marginLeft: 10})
                        ]}
                    />
                    <Text style={[
                        getFontFamily(language),
                        styles.cityText
                    ]}
                    >
                        {regionName}
                    </Text>
                </View>

                <MenuSection title={I18n.t('REFUGEE_INFO')}>
                    <MenuItem
                        active={route === 'info'}
                        icon="fa-info"
                        onPress={() => this._defaultOrFirst(region)}
                    >
                        {I18n.t('GENERAL_INFO') }
                    </MenuItem>
                    <MenuItem
                        active={route === 'services'}
                        icon="fa-list"
                        onPress={() => s('services')}
                    >
                        {I18n.t('SERVICE_LIST') }
                    </MenuItem>
                    <MenuItem
                        active={route === 'map'}
                        icon="fa-map"
                        onPress={() => s('map')}
                    >
                        {I18n.t('EXPLORE_MAP') }
                    </MenuItem>
                </MenuSection>

                <MenuSection>
                    <MenuItem
                        active={route === 'notifications'}
                        badge={bannerCount}
                        icon="ios-mail"
                        onPress={() => s('notifications')}
                    >
                        {I18n.t('ANNOUNCEMENTS')}
                    </MenuItem>
                    <MenuItem
                        active={route === 'news'}
                        icon="ios-paper"
                        onPress={() => s('news')}
                    >
                        {I18n.t('NEWS')}
                    </MenuItem>
                </MenuSection>

                {importantInformationSection}
                {nearbyCitiesSection}

                <MenuSection>
                    <MenuItem
                        icon="fa-gear"
                        active={route === 'settings'}
                        onPress={() => s('settings')}
                    >
                        {I18n.t('SETTINGS') }
                    </MenuItem>
                    {aboutUs &&
                    <MenuItem
                        icon="fa-question"
                        active={route === 'infoDetails' && navigator.currentRoute.props.slug == aboutUs.slug}
                        onPress={() => this._defaultOrFirst(aboutUs, true)}
                    >
                        {I18n.t('ABOUT') }
                    </MenuItem>
                    }
                    <MenuItem
                        icon="fa-comment"
                        onPress={() => Linking.openURL(feedbackUrl)}
                    >
                        {I18n.t('FEEDBACK') }
                    </MenuItem>

                    <MenuItem
                        icon="fa-facebook-square"
                        onPress={() => Linking.openURL(LIKE_PATH)}
                    >
                        {I18n.t('LIKE_US') }
                    </MenuItem>

                </MenuSection>
            </ScrollView>);
    }
}

const mapStateToProps = (state) => {
    return {
        locations: state.locations,
        route: state.navigation,
        region: state.region,
        language: state.language,
        drawerOpen: state.drawerOpen
    };
};

const lightNavigationStyles = StyleSheet.create({
    logo: {
        width: 150,
        resizeMode: 'contain',
        marginTop: 40
    },
    logoContainer: {
        flexGrow: 1,
        height: 70,
        flexDirection: 'row',
        paddingHorizontal: 20
    },
    view: {
        flexDirection: 'column',
        flex: 1,
        paddingBottom: 15
    },
    middleBorder: {
        borderLeftColor: themes.light.darkerDividerColor,
        borderLeftWidth: 1
    },
    outermostBorder: {
        borderLeftColor: themes.light.dividerColor,
        borderLeftWidth: 1
    },
    titleWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 30,
        marginTop: 40,
        marginBottom: 10,
        paddingHorizontal: 20
    },
    cityText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: themes.light.textColor
    }
});

export default connect(mapStateToProps)(Navigation);
