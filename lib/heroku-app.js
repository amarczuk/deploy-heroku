'use strict'

var path        = require('path'),
    util        = require( 'util' ),
    EventEmitter = require( 'events').EventEmitter;

function herokuApp( heroku, appConf ) {
    this.heroku = heroku;
    this.appConf = appConf;
}

util.inherits( herokuApp, EventEmitter );

var createApp = function() {
    var that = this,
        options = { name: this.appConf.name };

    this.emit( 'state', 'Creating application' );

    var appCreated = function( error, app ) {
        if ( error ) {
            that.emit( 'error', error );
            return;
        }
        that.emit( 'output', 'Heroku app created', null );
        that.emit( 'appOK', app );
    }

    if ( !this.appConf.organization ) {
        this.heroku.apps().create( options, appCreated );
        return;
    }

    options.personal = false;
    options.organization = this.appConf.organization;
    this.heroku.organizations().apps().create( options, appCreated );
}

herokuApp.prototype.ensureApp = function() {
    var that = this;

    this.emit( 'state', 'Checking application' );
   
    this.heroku.apps( this.appConf.name ).info( function( err, info ) {
        if ( err && err.statusCode && err.statusCode == 404 ) {
            createApp.apply( that );
            return;
        }

        if ( err ) {
            that.emit( 'error', err );
            return;
        }

        that.emit( 'appOK', info );
    } );

    return this;
}

herokuApp.prototype.scale = function() {
    var that = this;

    this.emit( 'state', 'Scaling application' );

    this.heroku.apps( this.appConf.name ).dynos().list( function( err, dynos ) {
        if ( err ) {
            that.emit( 'error', err );
            return;
        }

        var webdynos = 0, i;
        for ( i in dynos ) {
            if ( dynos[i].type == 'web' ) {
                webdynos++;
            }
        }

        if ( webdynos < that.appConf.webWorkers.min ) webdynos = that.appConf.webWorkers.min;
        if ( webdynos > that.appConf.webWorkers.max ) webdynos = that.appConf.webWorkers.max;

        that.heroku
            .apps( that.appConf.name )
            .formation()
            .batchUpdate( { updates: [ { process: "web", quantity: webdynos, size: that.appConf.processType } ] }
                , function( err, resp ) {
                    if ( err ) {
                        that.emit( 'error', err );
                        return;
                    }

                    that.emit( 'output', 'Heroku app scaled', null );
                    that.emit( 'scaled', resp );
                });

    } );

    return this;
}

exports = module.exports = herokuApp;