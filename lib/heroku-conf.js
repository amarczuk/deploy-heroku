'use strict'

var fs = require( 'fs' );

var getEntries = function( conf, node, result ) {
    var text = '', e;

    if ( typeof conf == 'object' ) {
        for ( e in conf ) {
            text = ( node ) ? node + ':' + e : e;
            getEntries( conf[e], text, result );
        }
    } else {
        result[node] = conf;
    }

    return;
};

var saveVars = function( heroku, appName, vars, envConfig, callback ) {
    
    var newVars = {};
    getEntries( envConfig, '', newVars );

    for ( var confV in newVars ) {
        if ( vars[confV] !== undefined ) {
            newVars[confV] = vars[confV];
        }
    }

    heroku.apps( appName ).configVars().update( newVars, function( err ) {
        callback( err, ( err ) ? null : newVars );
    }); 
};

exports.save = function( heroku, appName, configFile, callback ) {

    if ( !fs.existsSync( configFile ) ) {
        callback( new Error( 'Config file: ' + configFile + ' does not exist' ) );
        return;
    }

    var envConfig  = JSON.parse( fs.readFileSync( configFile ) );

    heroku.apps( appName ).configVars().info( function ( err, vars ) {
        if ( err ) {
            callback( err );
            return;
        }
        saveVars( heroku, appName, vars, envConfig, callback );
    });
}