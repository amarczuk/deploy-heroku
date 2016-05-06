var Heroku = require( 'heroku-client' ),
    nconf  = require( 'nconf' ),
    herokuConf = require( './heroku-conf' ),
    herokuApp  = require( './heroku-app' ),
    herokuRepo = require( './heroku-repo' ),
    util       = require( 'util' ),
    fs         = require( 'fs' ),
    EventEmitter = require( 'events').EventEmitter;

nconf.argv().env().file( 'deploy.json' );

var herokuDeploy = function( appName ) {
    var that = this;

    this.appName = appName;
    this.heroku = new Heroku( { token: nconf.get( 'herokuToken' ) } );
    this.herokuRepo = new herokuRepo( nconf.get( 'herokuToken' ), nconf, appName );

    this.herokuRepo
        .on( 'error', function( error ) {
            that.herokuRepo.clean();
            that.emit( 'error', error );
        } )
        .on( 'state', function( state ) {
            that.emit( 'state', state );
        } )
        .on( 'output', function( stdout, stderr ) {
            that.emit( 'output', stdout, stderr );
        } )
        .on( 'warning', function( msg ) {
            that.emit( 'warning', msg );
        } );

    var appsConfig = nconf.get( 'apps' ),
        appConfig;

    for ( var app in appsConfig ) {
        if ( appsConfig[app].name == appName ) {
            this.appConfig = appsConfig[app];
        }
    }

    this.herokuApp = new herokuApp( this.heroku, this.appConfig );

    this.herokuApp
        .on( 'error', function( error ) {
            that.herokuRepo.clean();
            that.emit( 'error', error );
        } )
        .on( 'state', function( state ) {
            that.emit( 'state', state );
        } )
        .on( 'output', function( stdout, stderr ) {
            that.emit( 'output', stdout, stderr );
        } );

    createApp.apply( this );
}

var createApp = function() {
    var that = this;

    this.herokuApp
        .ensureApp()
        .once( 'appOK', function( info ) {
            updateConfig.apply( that );
        });
}

var updateConfig = function() {
    var that = this,
        config = {};

    herokuConf.save( this.heroku, this.appName, this.appConfig.config, function( error, newConf ) {
        if ( error ) {
            that.emit( 'error', error );
            return;
        }

        checkout.apply( that );
    });
}

var checkout = function() {
    var that = this;

    this.herokuRepo
        .checkout()
        .once( 'checkoutDone', function() {
            updateRepo.apply( that );
        });
}

var updateRepo = function() {
    var that = this;

    this.herokuRepo
        .updateRepo()
        .once( 'updateDone', function() {
            deploy.apply( that );
        });
}

var deploy = function() {
    var that = this;

    this.herokuRepo
        .deploy()
        .once( 'deployDone', function() {
            scale.apply( that );
        });
}

var scale = function() {
    var that = this;

    this.herokuApp
        .scale()
        .once( 'scaled', function() {
            this.emit( 'done' );
        });
}

util.inherits( herokuDeploy, EventEmitter );

exports = module.exports = herokuDeploy;