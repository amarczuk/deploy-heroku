'use strict'

var fs         = require('fs-extended'),
    path        = require('path'),
    herokuRun   = require( 'herokuRun' ),
    util        = require( 'util' ),
    EventEmitter = require( 'events').EventEmitter;

function herokuTests( herokuToken, conf, appName ) {
    this.token = herokuToken;
    this.conf = conf.get( 'build' );
    this.cwd = process.cwd();
    this.folder = path.join( this.cwd, this.conf.tests.output );
    this.appName = appName;
    this.processType = '';
    for ( var i in conf.get( 'apps' ) ) {
        if ( this.conf.apps[i].name == appName ) {
            this.processType = this.conf.apps[i].processType;
        }
    }
    this.runner = herokuRun( herokuToken, appName, { size: processType } );
}

util.inherits( herokuTests, EventEmitter );

herokuTests.prototype.test = function() {
    var that = this;

    this.runner.run( 'bash', function( err, logger ) {

        if ( err ) {
            that.emit( 'error', err );
            return;
        }

        var outputEnd = false,
            output = '',
            testResults = {},
            testFiles = that.conf.tests.results,
            activeTest = false;

        for ( var i in testFiles ) {
            testResults[testFiles[i]] = { name: testFiles[i], running: false, finished: false, results: '' };
        }

        logger
            .on( 'connected', function( auth ) {
                this.emit( 'state', 'Running test command' );
                logger.send( that.tests.command + ' && echo -e "---- \\bend \\bof \\btests \\b----\u000D' );
            })
            .on( 'data', function( data ) {

                if ( !outputEnd ) {
                    output += data;
                    this.emit( 'output', data, '' );

                    if ( output.indexOf( '----endoftests---- ') > -1 ) {
                        outputEnd = true;
                        output = '';
                        data = '';
                    } else {
                        return;
                    }
                }

                if ( activeTest ) {
                    output += data;
                    var sot = '----startofresult' + activeTest.name + '----',
                        eot = '----endofresult' + activeTest.name + '----';
                    if ( output.indexOf( eot ) > -1 ) {
                        activeTest.finished = true;
                        activeTest.results = output
                                                .match( new RegExp( sot + '(.*?)' + eot ) )
                                                .replace( sot, '' )
                                                .replace( eot, '' )
                                                .trim();
                        try {
                            fs.writeFileSync( path.join( that.folder, path.basename( activeTest.name ) ), activeTest.results, { encoding: 'utf8' } );
                        } catch( e ) {
                            that.emit( 'error', e );
                        }
                        activeTest.running = false;
                        activeTest = false;
                        output = '';
                    }
                } else {
                    for ( var test in testResults ) {
                        if ( !testResults[test].finished ) {
                            activeTest = testResults[test];
                            this.emit( 'state', 'Copy test results [' + activeTest.name + ']' );
                            activeTest.running = true;
                            logger.send( 'echo -e "---- \\bstart \\bof \\bresult \\b' + activeTest.name + ' \\b----" && cat ' + activeTest.name + ' && echo -e "---- \\bend \\bof \\bresult \\b' + activeTest.name + ' \\b----"\u000D' );
                            return;
                        }
                    }
                    logger.send( 'exit\u000D' );
                    return;
                }


            })
            .on( 'end', function() {
                that.emit( 'tested' );
            })
            .on( 'error', function( err ) {
                that.emit( 'error', err );
            });
    });
}