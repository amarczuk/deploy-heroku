var projDir = path.join( __dirname, '..', '..', '..' ),
	EventEmitter    = require( 'events' ).EventEmitter;

function sampleModule( env, argv ) {
    this.app  = env;
    this.argv = argv;
}

util.inherits( sampleModule, EventEmitter );

sampleModule.prototype.startTesting = function( options ) {
	console.log( 'testing started' );

	this.emit( 'start', 'Start message' );
	this.emit( 'error', 'Error message' );
	this.emit( 'data', 'some data' );
	this.emit( 'end', 'End message' );

}

exports = module.exports = sampleModule;