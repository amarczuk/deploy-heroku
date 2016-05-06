var herokuConf = require( '../lib/heroku-conf' ),
    should = require( 'should' ),
    sinon  = require( 'sinon' ),
    Heroku = require( 'heroku-client' ),
    fs     = require( 'fs-extra' );

suite('Unit Test for heroku-conf', function () {

    var fakes;

    setup(function () {
        fakes = sinon.sandbox.create();
        fs.emptyDirSync( __dirname + '/tmp' );
    });

    teardown(function () {
        fakes.restore();
        fs.removeSync( __dirname + '/tmp' );
    });

    test('sends correct config to Heroku', function (done) {
        
        var herokuMock = new Heroku();
        var herokuFake = fakes.mock( herokuMock );
        var appsMock   = herokuMock.apps( 'app' );
        var appsFake   = fakes.mock( appsMock );
        var configMock = appsMock.configVars();
        var configFake = fakes.mock( configMock );

        var configJson = {
            option: "value",
            obj: {
                opt1: "val1",
                opt2: "val2",
                obj2: {
                    opt3: "val3"
                }
            },
            option2: 34
        }
        var configEnv = {
            "option": "value",
            "obj:opt1": "val1",
            "obj:opt2": "val2",
            "obj:obj2:opt3": "val3",
            "option2": 34
        }

        var app = 'my-app';
        var confFile = __dirname + '/tmp/test.json';
        fs.writeFileSync( confFile, JSON.stringify( configJson ) );

        herokuFake.expects( 'apps' ).exactly( 2 ).withArgs( app ).returns( appsMock );
        appsFake.expects( 'configVars' ).exactly( 2 ).returns( configMock );
        configFake.expects( 'info' ).once().yields( null, {} );
        configFake.expects( 'update' ).once().withArgs( configEnv ).yields( null );


        herokuConf.save( herokuMock, app, confFile, function( err, newVars ) {
            
            should.equal( err, null );
            should.deepEqual( newVars, configEnv );

            fakes.verify();
            done();
        });
        
    });

    test('updates config and sends it to Heroku', function (done) {
        
        var herokuMock = new Heroku();
        var herokuFake = fakes.mock( herokuMock );
        var appsMock   = herokuMock.apps( 'app' );
        var appsFake   = fakes.mock( appsMock );
        var configMock = appsMock.configVars();
        var configFake = fakes.mock( configMock );

        var configJson = {
            option: "value",
            obj: {
                opt1: "val1",
                opt2: "val2",
                obj2: {
                    opt3: "val3"
                }
            },
            option2: 34
        }
        var configEnv = {
            "option": "value",
            "obj:opt1": "val1corrected",
            "obj:opt2": "val2",
            "obj:obj2:opt3": "val3 new",
            "option2": 34
        }
        var configHer = {
            "obj:opt1": "val1corrected",
            "obj:obj2:opt3": "val3 new"
        }

        var app = 'my-app';
        var confFile = __dirname + '/tmp/test.json';
        fs.writeFileSync( confFile, JSON.stringify( configJson ) );

        herokuFake.expects( 'apps' ).exactly( 2 ).withArgs( app ).returns( appsMock );
        appsFake.expects( 'configVars' ).exactly( 2 ).returns( configMock );
        configFake.expects( 'info' ).once().yields( null, configHer );
        configFake.expects( 'update' ).once().withArgs( configEnv ).yields( null );


        herokuConf.save( herokuMock, app, confFile, function( err, newVars ) {
            
            should.equal( err, null );
            should.deepEqual( newVars, configEnv );

            fakes.verify();
            done();
        });
        
    });

    test('errors when cannot get Heroku config', function (done) {
        
        var herokuMock = new Heroku();
        var herokuFake = fakes.mock( herokuMock );
        var appsMock   = herokuMock.apps( 'app' );
        var appsFake   = fakes.mock( appsMock );
        var configMock = appsMock.configVars();
        var configFake = fakes.mock( configMock );

        var configJson = {
            option: "value",
            obj: {
                opt1: "val1",
                opt2: "val2",
                obj2: {
                    opt3: "val3"
                }
            },
            option2: 34
        }

        var app = 'my-app';
        var confFile = __dirname + '/tmp/test.json';
        fs.writeFileSync( confFile, JSON.stringify( configJson ) );

        herokuFake.expects( 'apps' ).once().withArgs( app ).returns( appsMock );
        appsFake.expects( 'configVars' ).once().returns( configMock );
        configFake.expects( 'info' ).once().yields( 'Error!' );
        configFake.expects( 'update' ).never();


        herokuConf.save( herokuMock, app, confFile, function( err, newVars ) {
            
            should.equal( err, 'Error!' );
            should.equal( newVars, null );

            fakes.verify();
            done();
        });
        
    });

    test('errors when cannot save Heroku config', function (done) {
        
        var herokuMock = new Heroku();
        var herokuFake = fakes.mock( herokuMock );
        var appsMock   = herokuMock.apps( 'app' );
        var appsFake   = fakes.mock( appsMock );
        var configMock = appsMock.configVars();
        var configFake = fakes.mock( configMock );

        var configJson = {
            option: "value",
            obj: {
                opt1: "val1",
                opt2: "val2",
                obj2: {
                    opt3: "val3"
                }
            },
            option2: 34
        }
        var configEnv = {
            "option": "value",
            "obj:opt1": "val1corrected",
            "obj:opt2": "val2",
            "obj:obj2:opt3": "val3 new",
            "option2": 34
        }
        var configHer = {
            "obj:opt1": "val1corrected",
            "obj:obj2:opt3": "val3 new"
        }

        var app = 'my-app';
        var confFile = __dirname + '/tmp/test.json';
        fs.writeFileSync( confFile, JSON.stringify( configJson ) );

        herokuFake.expects( 'apps' ).exactly( 2 ).withArgs( app ).returns( appsMock );
        appsFake.expects( 'configVars' ).exactly( 2 ).returns( configMock );
        configFake.expects( 'info' ).once().yields( null, configHer );
        configFake.expects( 'update' ).once().withArgs( configEnv ).yields( 'Error!' );


        herokuConf.save( herokuMock, app, confFile, function( err, newVars ) {
            
            should.equal( err, 'Error!' );
            should.equal( newVars, null );

            fakes.verify();
            done();
        });
        
    });

    test('errors when no config file', function (done) {
        
        var herokuMock = new Heroku();
        var herokuFake = fakes.mock( herokuMock );

        var app = 'my-app';

        herokuFake.expects( 'apps' ).never();

        herokuConf.save( herokuMock, app, 'iamnotthere.json', function( err, newVars ) {
            
            should.equal( err.message, 'Config file: iamnotthere.json does not exist' );
            should.equal( newVars, null );

            fakes.verify();
            done();
        });
        
    });

});