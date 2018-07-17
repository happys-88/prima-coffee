﻿define(
    ["modules/backbone-mozu", 'hyprlive'],
    function(Backbone, Hypr) {


        var countriesRequiringStateAndZip = {
            US: true,
            CA: true,
            JP: true,
            TW: true
        },
            defaultStateProv = "n/a";

        var PhoneNumbers = Backbone.MozuModel.extend({
            validation: {
                home: [{
                    minLength: 10,
                    maxLength: 10,
                    msg: Hypr.getLabel("phoneIncomplete")
                },{
                    required: true,
                    msg: Hypr.getLabel("phoneIncorrect")
                }]
            }
        }),

        StreetAddress = Backbone.MozuModel.extend({
            mozuType: 'address',
            initialize: function() {
                this.on('change:countryCode', this.clearStateAndZipWhenCountryChanges, this);
            },
            clearStateAndZipWhenCountryChanges: function() {
                this.unset('postalOrZipCode');
                this.unset('stateOrProvince');
            },
            validation: {
                address1: {
                    required: true,
                    msg: Hypr.getLabel("streetMissing")
                },
                cityOrTown: {
                    required: true,
                    msg: Hypr.getLabel("cityMissing")
                },
                countryCode: {
                    required: true,
                    msg: Hypr.getLabel("countryMissing")
                },
                stateOrProvince: {
                    fn: "requiresStateAndZip",
                    msg: Hypr.getLabel("stateProvMissing")
                },
                postalOrZipCode: [{
                    fn: "requiresStateAndZip",
                    msg: Hypr.getLabel("postalCodeIncorrect")
                },
                {
                    minLength: 5,
                    msg: Hypr.getLabel("postalCodeIncomplete")  
                }]
            },
            requiresStateAndZip: function(value, attr) {
                if ((this.get('countryCode') in countriesRequiringStateAndZip) && !value) return this.validation[attr.split('.').pop()].msg;
            },
            defaults: {
                candidateValidatedAddresses: null,
                countryCode: Hypr.getThemeSetting('preselectCountryCode') || '',
                addressType: 'Residential'
            },
            toJSON: function(options) {
                // workaround for SA
                var j = Backbone.MozuModel.prototype.toJSON.apply(this, arguments);
                if ((!options || !options.helpers) && !j.stateOrProvince) {
                    j.stateOrProvince = defaultStateProv;
                }
                if (options && options.helpers && j.stateOrProvince === defaultStateProv) {
                    delete j.stateOrProvince;
                }
                return j;
            },
            is: function(another) {
                var s1 = '', s2 = '';
                for (var k in another) {
                    if (k === 'isValidated')
                        continue;
                    s1 = (another[k] || '').toLowerCase();
                    s2 = (this.get(k) || '').toLowerCase();
                    if (s1 != s2) {
                        return false;
                    }
                }
                return true;
            }
        });

        return {
            PhoneNumbers: PhoneNumbers,
            StreetAddress: StreetAddress
        };
    });
