var herokuApp = require( '../lib/heroku-app' ),
    should = require( 'should' ),
    sinon  = require( 'sinon' ),
    fs     = require( 'fs-extra' ),
    Heroku = require( 'heroku-client' ),
    path   = require( 'path' );

suite('Unit Test for heroku-app', function () {

    var fakes;

    setup(function () {
        fakes = sinon.sandbox.create();
        fs.removeSync( __dirname + '/../.herokuDeploy' );
    });

    teardown(function () {
        fakes.restore();
        fs.removeSync( __dirname + '/../.herokuDeploy' );
    });

    var assertCreate = function( conf, appExists, private, appError, done ) {

        var herokuMock  = new Heroku();
        var herokuFake  = fakes.mock( herokuMock );
        var appsMock    = herokuMock.apps( 'app' );
        var appsFake    = fakes.mock( appsMock );
        var orgMock     = herokuMock.organizations();
        var orgFake     = fakes.mock( orgMock );
        var orgAppsMock = orgMock.apps();
        var orgAppsFake = fakes.mock( orgAppsMock );
        var error       = null;
        var info        = null;

        if ( !appExists ) {
            error = { statusCode: 404 };
        } else {
            info = 'existing app';
        }

        if ( appError && appError == 'info' ) {
            error = 'error!';
        }

        herokuFake.expects( 'apps' ).once().withArgs( conf.name ).returns( appsMock );
        appsFake.expects( 'info' ).once().withArgs().yields( error, info );

        if ( !appExists ) {
            if ( private ) {
                herokuFake.expects( 'apps' ).once().withArgs().returns( appsMock );
                appsFake.expects( 'create' ).once().withArgs( { name: conf.name } ).yields( appError, 'my app: ' + conf.name );
            } else {
                herokuFake.expects( 'organizations' ).once().withArgs().returns( orgMock );
                orgFake.expects( 'apps' ).once().withArgs().returns( orgAppsMock );
                orgAppsFake.expects( 'create' ).once().withArgs( { name: conf.name, personal: false, organization: conf.organization } ).yields( appError, 'my org app: ' + conf.name );
            }
        }

        var output = '',
            states = '';

        var app = new herokuApp( herokuMock, conf );

        app.on( 'output', function( stdo, stde ) {
            output += stdo + ' ' + stde + ' ';
        } );

        app.on( 'state', function( state ) {
            states += state + ' ';
        } );

        app.on( 'appOK', function( result ) {
            output = output.replace(/[\n\r]*/g, '').replace( /\s+/g, ' ' ).trim();
            states = states.replace(/[\n\r]*/g, '').replace( /\s+/g, ' ' ).trim();

            fakes.verify();
            done( result, output, states );
        } );

        app.on( 'error', function( error ) {
            if ( !appError ) {
                console.log(error);
                true.should.be.false;
            }
            done( error );
        } );

        app.ensureApp();
    }

    test('ensureApp - creates private app if not there', function (done) {

        var config = {
            "name": "myapp-dev",
            "processType": "standard-1X",
            "webWorkers": {
                "min": 1,
                "max": 1
            }
        };

        assertCreate( config, false, true, null, function( res, out, states ) {
            res.should.equal( 'my app: myapp-dev' );
            out.should.equal( 'Heroku app created null' );
            states.should.equal( 'Checking application Creating application' );

            done();
        });
        
    });

    test('ensureApp - creates org app if not there', function (done) {

        var config = {
            "name": "myorgapp-dev",
            "processType": "standard-1X",
            "organization": "myorg",
            "webWorkers": {
                "min": 1,
                "max": 1
            }
        };

        assertCreate( config, false, false, null, function( res, out, states ) {
            res.should.equal( 'my org app: myorgapp-dev' );
            out.should.equal( 'Heroku app created null' );
            states.should.equal( 'Checking application Creating application' );

            done();
        });

    });

    test('ensureApp - returns current app info if found', function (done) {

        var config = {
            "name": "myapp-dev",
            "processType": "standard-1X",
            "organization": "myorg",
            "webWorkers": {
                "min": 1,
                "max": 1
            }
        };

        assertCreate( config, true, false, null, function( res, out, states ) {
            res.should.equal( 'existing app' );
            out.should.equal( '' );
            states.should.equal( 'Checking application' );

            done();
        });
    });

    test('ensureApp - emits error when cannot get app info', function (done) {

        var config = {
            "name": "myapp-dev",
            "processType": "standard-1X",
            "organization": "myorg",
            "webWorkers": {
                "min": 1,
                "max": 1
            }
        };

        assertCreate( config, true, false, 'info', function( error ) {
            error.should.equal( 'error!' );

            done();
        });
    });

    test('ensureApp - emits error when cannot create private app', function (done) {

        var config = {
            "name": "myapp-dev",
            "processType": "standard-1X",
            "organization": "",
            "webWorkers": {
                "min": 1,
                "max": 1
            }
        };

        assertCreate( config, false, true, 'private app error!', function( error ) {
            error.should.equal( 'private app error!' );

            done();
        });
    });

    test('ensureApp - emits error when cannot create org app', function (done) {

        var config = {
            "name": "myapp-dev",
            "processType": "standard-1X",
            "organization": "myorg",
            "webWorkers": {
                "min": 1,
                "max": 1
            }
        };

        assertCreate( config, false, false, 'org app error!', function( error ) {
            error.should.equal( 'org app error!' );

            done();
        });
    });

    var assertScale = function( conf, appError, webDynosCnt, expectedDynos, done ) {

        var herokuMock  = new Heroku();
        var herokuFake  = fakes.mock( herokuMock );
        var appsMock    = herokuMock.apps( 'app' );
        var appsFake    = fakes.mock( appsMock );
        var formationMock = appsMock.formation();
        var formationFake = fakes.mock( formationMock );
        var dynosMock = appsMock.dynos();
        var dynosFake = fakes.mock( dynosMock );
        var webDynos  = [];

        for ( var i = 0; i < webDynosCnt; i++ ) {
            webDynos.push( {type: 'web'} );
        }

        herokuFake.expects( 'apps' ).exactly( (appError) ? 1 : 2 ).withArgs( conf.name ).returns( appsMock );
        appsFake.expects( 'dynos' ).once().withArgs().returns( dynosMock );
        dynosFake.expects( 'list' ).once().withArgs().yields( appError, webDynos );

        if ( !appError ) {
            appsFake.expects( 'formation' ).once().withArgs().returns( formationMock );
            formationFake.expects( 'batchUpdate' ).once().withArgs( { updates: [ { process: "web", quantity: expectedDynos, size: conf.processType } ] } ).yields( appError, 'my org app: ' + conf.name );
        }

        var output = '',
            states = '';

        var app = new herokuApp( herokuMock, conf );

        app.on( 'output', function( stdo, stde ) {
            output += stdo + ' ' + stde + ' ';
        } );

        app.on( 'state', function( state ) {
            states += state + ' ';
        } );

        app.on( 'scaled', function( result ) {
            output = output.replace(/[\n\r]*/g, '').replace( /\s+/g, ' ' ).trim();
            states = states.replace(/[\n\r]*/g, '').replace( /\s+/g, ' ' ).trim();

            fakes.verify();
            done( result, output, states );
        } );

        app.on( 'error', function( error ) {
            if ( !appError ) {
                console.log(error);
                true.should.be.false;
            }
            done( error );
        } );

        app.scale();
    }

    test('scale - sets the min', function (done) {

        var config = {
            "name": "myapp-dev",
            "processType": "standard-1X",
            "organization": "myorg",
            "webWorkers": {
                "min": 10,
                "max": 15
            }
        };

        assertScale( config, null, 2, 10, function( res, out, states ) {
            res.should.equal( 'my org app: myapp-dev' );
            out.should.equal( 'Heroku app scaled null' );
            states.should.equal( 'Scaling application' );

            done();
        });
    });

    test('scale - sets the max', function (done) {

        var config = {
            "name": "myapp-dev",
            "processType": "standard-1X",
            "organization": "myorg",
            "webWorkers": {
                "min": 10,
                "max": 15
            }
        };

        assertScale( config, null, 20, 15, function( res, out, states ) {
            res.should.equal( 'my org app: myapp-dev' );
            out.should.equal( 'Heroku app scaled null' );
            states.should.equal( 'Scaling application' );

            done();
        });
    });

    test('scale - does not change', function (done) {

        var config = {
            "name": "myapp-dev",
            "processType": "standard-1X",
            "organization": "myorg",
            "webWorkers": {
                "min": 10,
                "max": 15
            }
        };

        assertScale( config, null, 13, 13, function( res, out, states ) {
            res.should.equal( 'my org app: myapp-dev' );
            out.should.equal( 'Heroku app scaled null' );
            states.should.equal( 'Scaling application' );

            done();
        });
    });

    test('scale - errors', function (done) {

        var config = {
            "name": "myapp-dev",
            "processType": "standard-1X",
            "organization": "myorg",
            "webWorkers": {
                "min": 10,
                "max": 15
            }
        };

        assertScale( config, 'error!', 13, 13, function( error ) {
            error.should.equal( 'error!' );

            done();
        });
    });

});