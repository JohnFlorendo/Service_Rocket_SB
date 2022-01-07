define([],

    function () {
        var fn = {};

        fn.isoCountries = {
            'Australia' : 'AUS',
            'Australia (Queensland)' : 'Qld',
            'Canada' : 'CA',
            'Chile' : 'CL',
            'Malaysia' : 'MY',
            'Singapore' : 'SG',
            'United Kingdom' : 'UK',
            'United States' : 'US'
        }

        fn.getCountryCode = function (countryName) {
            if (fn.isoCountries.hasOwnProperty(countryName)) {
                return fn.isoCountries[countryName];
            } else {
                return countryName;
            }
        }

        return fn;
    });
