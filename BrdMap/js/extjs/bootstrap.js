/*
This file is part of Ext JS 4.2

Copyright (c) 2011-2013 Sencha Inc

Contact:  http://www.sencha.com/contact

Pre-release code in the Ext repository is intended for development purposes only and will
not always be stable. 

Use of pre-release code is permitted with your application at your own risk under standard
Ext license terms. Public redistribution is prohibited.

For early licensing, please contact us at licensing@sencha.com

Build date: 2013-02-13 19:36:35 (686c47f8f04c589246d9f000f87d2d6392c82af5)
*/
/**
 * Load the library located at the same path with this file
 *
 * Will automatically load ext-all-dev.js if any of these conditions is true:
 * - Current hostname is localhost
 * - Current hostname is an IP v4 address
 * - Current protocol is "file:"
 *
 * Will load ext-all.js (minified) otherwise
 */
(function() {
    var scripts = document.getElementsByTagName('script'),
        localhostTests = [
            /^localhost$/
        ],
        host = window.location.hostname,
        isDevelopment = null,
        queryString = window.location.search,
        test, path, i, ln, scriptSrc, match;

    for (i = 0, ln = scripts.length; i < ln; i++) {
        scriptSrc = scripts[i].src;

        match = scriptSrc.match(/bootstrap\.js$/);

        if (match) {
            path = scriptSrc.substring(0, scriptSrc.length - match[0].length);
            break;
        }
    }

    if (queryString.match('(\\?|&)debug') !== null) {
        isDevelopment = true;
    }
    else if (queryString.match('(\\?|&)nodebug') !== null) {
        isDevelopment = false;
    }

    if (isDevelopment === null) {
        for (i = 0, ln = localhostTests.length; i < ln; i++) {
            test = localhostTests[i];

            if (host.search(test) !== -1) {
                isDevelopment = true;
                break;
            }
        }
    }

    if (isDevelopment === null && window.location.protocol === 'file:') {
        isDevelopment = true;
    }
    
    isDevelopment = true;
    document.write('<script type="text/javascript" charset="UTF-8" src="' + 
        path + 'ext-all' + (isDevelopment ? '-dev' : '') + '.js"></script>');
    document.write('<script type="text/javascript" charset="UTF-8" src="' + 
        path + 'override/override.js"></script>');    
    document.write('<script type="text/javascript" charset="UTF-8" src="' + 
        path + 'locale/ext-lang-zh_CN.js"></script>');
})();

