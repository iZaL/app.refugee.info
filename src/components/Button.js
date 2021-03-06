import React, {Component, PropTypes} from 'react';
import {StyleSheet, TouchableHighlight, TouchableOpacity, View} from 'react-native';
import styles, {
    themes,
    getElevation
} from '../styles';
import {DirectionalText, Icon} from '../components';

export class Button extends Component {

    static propTypes = {
        buttonStyle: PropTypes.object,
        color: PropTypes.oneOf(['white', 'black', 'green', 'facebook']),
        icon: PropTypes.string,
        iconStyle: PropTypes.object,
        onPress: PropTypes.func,
        text: PropTypes.string,
        textStyle: PropTypes.object,
        transparent: PropTypes.bool
    };

    getButtonColor(color) {
        if (color == 'black') return componentStyles.buttonBlack;
        else if (color == 'green') return componentStyles.buttonGreen;
        else if (color == 'facebook') return componentStyles.buttonFacebook;
        else return componentStyles.buttonWhite;
    }

    getButtonUnderlayColor(color) {
        if (color == 'black') return 'rgba(255,255,255,0.2)';
        else if (color == 'green') return 'rgba(0,150,70,0.8)';
        else return 'rgba(177,177,177,0.5)';
    }

    getButtonTextColor(color) {
        if (color == 'black') return componentStyles.buttonTextBlack;
        else if (color == 'green') return componentStyles.buttonTextGreen;
        else if (color == 'facebook') return componentStyles.buttonTextFacebook;
        else return componentStyles.buttonTextWhite;
    }

    renderIcon() {
        const {transparent, icon, iconStyle, color} = this.props;
        if (!icon) {
            return null;
        }
        return (
            <View style={[
                !transparent && {paddingLeft: 10},
                transparent && {paddingHorizontal: 0, marginBottom: 5},
                styles.alignCenter,
                {height: 24}]}
            >
                <Icon
                    name={icon}
                    style={[
                        transparent ? {color: themes.light.greenAccentColor} : this.getButtonTextColor(color),
                        componentStyles.buttonIcon,
                        iconStyle
                    ]}
                />
            </View>
        );
    }

    render() {
        const {text, color, onPress, textStyle, buttonStyle, transparent} = this.props;
        const iconImage = this.renderIcon();

        if (transparent) {
            return (
                <View style={[{flex: 1}, buttonStyle]}>
                    <TouchableOpacity
                        activeOpacity={0.5}
                        onPress={onPress}
                        style={componentStyles.buttonInner}
                    >
                        {iconImage}
                        <View style={componentStyles.buttonTextContainer}>
                            <DirectionalText style={[
                                componentStyles.buttonText,
                                {color: themes.light.greenAccentColor},
                                textStyle]}
                            >
                                {text}
                            </DirectionalText>
                        </View>
                    </TouchableOpacity>
                </View>
            );
        }

        return (
            <View
                style={[
                    getElevation(),
                    this.getButtonColor(color),
                    componentStyles.button,
                    buttonStyle
                ]}
            >
                <TouchableHighlight
                    onPress={onPress}
                    style={[componentStyles.buttonInner, {marginHorizontal: 0}]}
                    underlayColor={this.getButtonUnderlayColor(color)}
                >
                    <View style={[
                        componentStyles.buttonTextContainer,
                        styles.row
                    ]}
                    >
                        {iconImage}
                        <DirectionalText style={[
                            componentStyles.buttonText,
                            this.getButtonTextColor(color),
                            textStyle]}
                        >
                            {text}
                        </DirectionalText>
                    </View>
                </TouchableHighlight>
            </View>
        );
    }
}

const componentStyles = StyleSheet.create({
    button: {
        flexGrow: 1,
        height: 45,
        borderRadius: 2
    },
    buttonInner: {
        flexGrow: 1,
        marginHorizontal: 5,
        alignItems: 'center',
        justifyContent: 'center'
    },
    buttonWhite: {
        backgroundColor: themes.light.backgroundColor
    },
    buttonBlack: {
        backgroundColor: themes.dark.toolbarColor
    },
    buttonGreen: {
        backgroundColor: themes.light.greenAccentColor
    },
    buttonFacebook: {
        backgroundColor: '#3b5998'
    },
    buttonTextContainer: {
        alignItems: 'center'
    },
    buttonText: {
        fontSize: 13,
        textAlign: 'center'
    },
    buttonIcon: {
        fontSize: 22,
        paddingHorizontal: 5
    },
    buttonTextWhite: {
        color: themes.light.textColor
    },
    buttonTextBlack: {
        color: themes.dark.textColor
    },
    buttonTextGreen: {
        color: themes.dark.textColor
    },
    buttonTextFacebook: {
        color: themes.dark.textColor
    }
});

export default Button;
