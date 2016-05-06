var fs = require( 'fs' ),
	projDir = path.join( __dirname, '..', '..', '..', 'build' ),
	hr      = require( './herokuRunner.js' ),
    EventEmitter    = require( 'events').EventEmitter;

function testRunner( env ) {
    this.app = env;
    try {
		fs.unlinkSync( path.join( projDir, 'logs', 'tests.txt' ) );
		fs.unlinkSync( path.join( projDir, 'logs', 'junit.xml' ) );
		fs.unlinkSync( path.join( projDir, 'logs', 'clover.xml' ) );
	} catch( e ) {
		
	}
}

util.inherits( testRunner, EventEmitter );

var regexMatch = function( sRegexp, sString  ) {
	var res = [];
	var match = sRegexp.exec( sString );
	while ( match != null ) {

		res.push( match );
	    match = sRegexp.exec( sString );
	}

	return res;
}

var getResults = function() {
	var results = {};
	try {
		var fullOutput = fs.readFileSync( projDir + '/logs/tests.txt' ).toString();
	} catch (e) {
		this.emit( 'error', 'no test results found' );
		return;
	}

	var output = fullOutput.substr( fullOutput.indexOf( '\n' ) );

	var rxSearch = /---(.*?\.xml)---([\s\S]*?)---\/(.*?.xml)---/gmi
	var res = regexMatch( rxSearch, output );
	var result = '';

	for ( var idx in res ) {
		result = new Buffer( res[idx][2].trim(), 'base64' ).toString( 'ascii' ).trim();
		fs.writeFileSync( projDir + '/logs/' + res[idx][1], result );
		fullOutput = fullOutput.replace( res[idx][0], '' );
	}

	this.emit( 'end', fullOutput );
}

testRunner.prototype.startTesting = function( command ) {
	console.log( 'testing started' );

	var runner = new hr( this.app ),
		that   = this,
		output = '';

	runner.run( command );

	runner.on('connected', function(msg) {
	    that.emit( 'connected', msg );
	});

	runner.on('data', function(data) {
	    output += data.toString();
	});

	runner.on('error', function( err ) {
	    that.emit( 'error', err );
	});

	runner.on('end', function() {
	    fs.writeFileSync( projDir + '/logs/tests.txt', output );  
		getResults.apply( that );
	});

}

exports = module.exports = testRunner;