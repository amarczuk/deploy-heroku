var herokuTests = require( '../lib/heroku-tests' ),
    should = require( 'should' ),
    sinon  = require( 'sinon' ),
    fs     = require( 'fs-extra' ),
    Heroku = require( 'heroku-client' ),
    path   = require( 'path' ),
    util        = require( 'util' ),
    EventEmitter = require( 'events').EventEmitter;

suite('Unit Test for heroku-tests', function () {

    var fakes, conf;

    setup(function () {
        fakes = sinon.sandbox.create();
        fs.removeSync( __dirname + '/../.herokuDeploy' );
        var confBuild = {
                    "baseFolder": ".",
                    "ignoreFoldersTestRun": [ ".git", "node_modules", "deploy" ],
                    "ignoreFoldersDeploy": [ ".git", "node_modules", "deploy", "tests" ],
                    "webrootFolder": "",
                    "tests":{
                            "command": "I am test command",
                            "results": [ "tests/results/junit.xml" ],
                            "output": "./tests/results"
                        }
                    },
            confApps = [
                    {
                        "name": "heroku-deploy-example-dev",
                        "config": "./deploy/dev.json",
                        "processType": "free",
                        "webWorkers": {
                            "min": 1,
                            "max": 1
                        }
                    },
                    {
                        "name": "heroku-deploy-example-ci",
                        "config": "./deploy/ci.json",
                        "processType": "free",
                        "webWorkers": {
                            "min": 0,
                            "max": 0
                        }
                    },
                    {
                        "name": "heroku-deploy-example-prod",
                        "config": "./deploy/prod.json",
                        "processType": "free",
                        "organization": "myorg",
                        "webWorkers": {
                            "min": 5,
                            "max": 10

                        }
                    }
                   ],
            conf = { get: function() };
    });

    teardown(function () {
        fakes.restore();
    });

    test('test - runs test command and saves result files', function (done) {

        var logger = { send: function() };
        util.inherits( loggerMock, EventEmitter );
        var loggerMock = fakes.mock( logger );
        
        loggerMock.expects( 'on' ).once().withArgs( 'connected' ).yields( true );
        loggerMock.expects( 'send' ).once().withArgs( confBuild.tests.command + ' && echo -e "---- \\bend \\bof \\btests \\b----\u000D' ).yields( true );

        var herokuRunMock = { run: function() {} };
        fakes.mock( herokuRunMock ).expects( 'run' ).withArgs( 'bash' ).yields( null, logger );

        var confMock = fakes.mock( conf );
        confMock.expects( 'get' ).once().withArgs( 'build' ).returns( confBuild );
        confMock.expects( 'get' ).once().withArgs( 'apps' ).returns( confApps );


        var tests = new herokuTests( 'token', conf, confApps[0].name );
    });


});