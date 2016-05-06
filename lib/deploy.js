var herokuDeploy = require( './heroku-deploy' );

if ( !process.argv[2] ) {
	console.log( 'Usage: node deploy [appName]' );
	process.exit(1);
}

var deploy = new herokuDeploy( process.argv[2] );
deploy.on( 'output', function( std, err ) {
	console.log( std );
	if ( err ) {
		console.log( err );
	}
}).on( 'state', function( state ) {
	console.log( state );
}).on( 'warning', function( msg ) {
	console.log( 'warning: ' + msg );
}).on( 'error', function( error ) {
	console.log( error );
	process.exit(1);
}).on( 'done', function() {
	console.log( 'Deployment successful' );
	process.exit(0);
} );