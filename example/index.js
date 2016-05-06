var express         = require( 'express' ),
	nconf           = require( 'nconf' ).env(),
	app             = express();

app.get( '/'
	, function( req, res ) {
		res.set( 'Content-Type', 'text/plain; charset=utf-8' )
		   .status( 200 )
		   .send( 'I am example app' );
	} );
	
app.listen( nconf.get( 'PORT' ), function() {
	console.log( 'Listening on ' + nconf.get( 'PORT' ) );
} );
