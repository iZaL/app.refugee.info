import React, {Component} from 'react';
import {View, Text, TextInput, AsyncStorage, Linking, Platform, WebView} from 'react-native';
import {wrapHtmlContent} from '../utils/htmlUtils'
import styles, {themes} from '../styles';
import I18n from '../constants/Messages';
import {connect} from 'react-redux';
import {MapButton, OfflineView, SearchBar} from '../components';
import {Regions} from '../data';
import {RNMail as Mailer} from 'NativeModules';

var WEBVIEW_REF = 'webview';
export class GeneralInformationDetails extends Component {

    static propTypes = {
        title: React.PropTypes.string.isRequired,
        section: React.PropTypes.string.isRequired
    };

    static contextTypes = {
        navigator: React.PropTypes.object.isRequired
    };


    constructor(props) {
        super(props);
        this.webView = null;
        this.state = {
            loading: false,
            source: false
        };
    }

    componentDidMount() {
        this._loadInitialState();
    }

    _loadInitialState() {
        const {section, sectionTitle, language, theme} = this.props;

        let source = {
            html: wrapHtmlContent(section, language, sectionTitle, theme)
        };

        this.setState({
            source: source
        });
    }


    _onChangeText(text) {
        // TODO: Refactor this searches all of the text including tags

        const {sectionTitle, language, theme} = this.props;

        if (text.length < 5) {
            return;
        }

        let reg = new RegExp(`(${text})`, 'ig');
        section = (reg) ? this.props.section.replace(reg, '<mark>$1</mark>') : this.props.section;

        let source = {
            html: wrapHtmlContent(section, language, sectionTitle, theme)
        };

        this.setState({
            source: source
        });
    }

    _onNavigationStateChange(state) {
        // Opening all links in the external browser except for the internal links
        let url = state.url;
        if (url.indexOf('data:') == 0) {
            return;
        }

        if (url.indexOf('refugeeinfo') > -1 || url.indexOf('refugee.info') > -1) {
            url = url.substr(url.indexOf('://') + 3);
            url = url.substr(url.indexOf('/'));
        }

        if (this.webView) {
            if (state.navigationType && state.navigationType === 'click') {
                // Image are loaded using this method. So this narrows down to prevent all clicks.
                this.webView.stopLoading();
            }

            if (url.indexOf('/') == 0) {
                // If we get to this point, we need to point to the app
                let fullSlug = url.substr(1).split('/')[0];

                Regions.searchImportantInformation(fullSlug).then((info) => {
                    const {navigator} = this.context;
                    navigator.to('info', null, { information: info });
                });
                if(Platform.OS == 'android') {
                    this.webView.goBack();
                }
            } else {
                if (state.url.indexOf('mailto') == 0 && Platform.OS == 'android') {
                    let email = state.url.split('mailto:')[1];
                    Mailer.mail({
                        recipients: [email],
                    }, (error, event) => {
                    });
                    this.webView.goBack();
                } else {
                    Linking.openURL(state.url);
                    this.webView.goBack();
                }
            }
        }
    }

    render() {
        if (!this.state.source) {
            return <View />;
        }
        const {theme} = this.props;
        let backgroundColor = theme == 'light' ? themes.light.backgroundColor : themes.dark.backgroundColor;

        return (
            <View style={styles.container}>
                <WebView ref={(v) => this.webView = v}
                    onNavigationStateChange={(s) => this._onNavigationStateChange(s) }
                    source={this.state.source}
                    style={{ backgroundColor: backgroundColor }}
                    onError={() => console.log(...arguments) }
                    />
                <MapButton
                    direction={this.props.direction}
                    />
            </View>
        );
    }
}


const mapStateToProps = (state) => {
    return {
        primary: state.theme.primary,
        language: state.language,
        theme: state.theme.theme,
        direction: state.direction
    };
};

export default connect(mapStateToProps)(GeneralInformationDetails);
