var herokuRepo = require( '../lib/heroku-repo' ),
    should = require( 'should' ),
    sinon  = require( 'sinon' ),
    fs     = require( 'fs-extra' ),
    path   = require( 'path' );

suite('Unit Test for heroku-repo', function () {

    var fakes,
        conf = { get: function() {} };

    setup(function () {
        fakes = sinon.sandbox.create();
        fs.removeSync( __dirname + '/../.herokuDeploy' );
    });

    teardown(function () {
        fakes.restore();
        fs.removeSync( __dirname + '/../.herokuDeploy' );
    });

    test('checkout - execute all steps', function (done) {

        var config = {
            "baseFolder": "",
            "ignoreFoldersTestRun": [ ".git", "node_modules", "deploy" ],
            "ignoreFoldersDeploy": [ ".git", "node_modules", "deploy", "tests" ],
            "webrootFolder": "public"
        };

        fakes.mock( conf ).expects( 'get' ).withArgs( 'build' ).returns( config );
        
        var app = 'my-app',
            token = 'iamtoken',
            output = '',
            states = '';

        var repo = new herokuRepo( token, conf, app );
        repo.gitCmd = 'node ' + path.join( __dirname , 'helpers', 'gitcmd.js' );

        repo.on( 'output', function( stdo, stde ) {
            output += stdo + ' ' + stde + ' ';
        } );

        repo.on( 'state', function( state ) {
            states += state + ' ';
        } );

        repo.on( 'checkoutDone', function() {
            output = output.replace(/[\n\r]*/g, '').replace( /\s+/g, ' ' ).trim();
            states = states.replace(/[\n\r]*/g, '').replace( /\s+/g, ' ' ).trim();
            
            output.should.equal( 'init . config user.email deploy@example.comconfig user.name Heroku Deployment Script remote add heroku https://user:iamtoken@git.heroku.com/my-app.git pull heroku master' );
            states.should.equal( 'Creating temporary deployment folder Initialize git repo Set git user Add Heroku remote Pull Heroku master' );

            fakes.verify();
            done();
        } );

        repo.on( 'error', function( error ) {
            console.log(error);
            true.should.be.false;  
        } );

        repo.checkout();
        
    });

    test('checkout - error', function (done) {

        var config = {
            "baseFolder": "",
            "ignoreFoldersTestRun": [ ".git", "node_modules", "deploy" ],
            "ignoreFoldersDeploy": [ ".git", "node_modules", "deploy", "tests" ],
            "webrootFolder": "public"
        };

        fakes.mock( conf ).expects( 'get' ).withArgs( 'build' ).returns( config );
        
        var app = 'my-app',
            token = 'iamtoken',
            output = '',
            states = '';

        var repo = new herokuRepo( token, conf, app );
        repo.gitCmd = 'notacommand ';

        repo.on( 'output', function( stdo, stde ) {
            output += stdo + ' ' + stde + ' ';
        } );

        repo.on( 'state', function( state ) {
            states += state + ' ';
        } );

        repo.on( 'checkoutDone', function() {
            true.should.be.false;            
        } );

        repo.on( 'error', function( error ) {
            
            error.stderr.should.containEql( 'notacommand' );

            fakes.verify();
            done();
        } );

        repo.checkout();
        
    });

    test('updateRepo - for test build', function (done) {
        this.timeout(10000);

        var config = {
            "baseFolder": "",
            "ignoreFoldersTestRun": [ ".git", "node_modules", "deploy" ],
            "ignoreFoldersDeploy": [ ".git", "node_modules", "deploy", "tests" ],
            "webrootFolder": "public"
        };

        fakes.mock( conf ).expects( 'get' ).withArgs( 'build' ).returns( config );
        
        var app = 'my-app',
            token = 'iamtoken',
            output = '',
            states = '';

        var repo = new herokuRepo( token, conf, app );
        repo.gitCmd = 'node ' + path.join( __dirname , 'helpers', 'gitcmd.js' );

        repo.on( 'output', function( stdo, stde ) {
            output += stdo + ' ' + stde + ' ';
        } );

        repo.on( 'state', function( state ) {
            states += state + ' ';
        } );

        repo.on( 'error', function( error ) {
            console.log(error);
            true.should.be.false;            
        } );

        repo.on( 'updateDone', function() {

            output = output.replace(/[\n\r]*/g, '').replace( /\s+/g, ' ' ).trim();
            states = states.replace(/[\n\r]*/g, '').replace( /\s+/g, ' ' ).trim();
            
            output.should.equal( 'add * commit -m Auto build' );
            states.should.equal( 'Updating local repository Copying source files Commit to local master' );

            fs.existsSync( __dirname + '/../.herokuDeploy/node_modules' ).should.be.false;
            fs.existsSync( __dirname + '/../.herokuDeploy/.git' ).should.be.false;
            fs.existsSync( __dirname + '/../.herokuDeploy/.herokuDeploy' ).should.be.false;
            fs.existsSync( __dirname + '/../.herokuDeploy/lib' ).should.be.true;
            fs.existsSync( __dirname + '/../.herokuDeploy/tests' ).should.be.true;

            fakes.verify();
            done();
        } );

        repo.updateRepo( true );
        
    });

    test('updateRepo - for deployment', function (done) {
        this.timeout(10000);

        var config = {
            "baseFolder": "",
            "ignoreFoldersTestRun": [ ".git", "node_modules", "deploy" ],
            "ignoreFoldersDeploy": [ ".git", "node_modules", "deploy", "tests" ],
            "webrootFolder": "public"
        };

        fakes.mock( conf ).expects( 'get' ).withArgs( 'build' ).returns( config );
        
        var app = 'my-app',
            token = 'iamtoken',
            output = '',
            states = '';

        var repo = new herokuRepo( token, conf, app );
        repo.gitCmd = 'node ' + path.join( __dirname , 'helpers', 'gitcmd.js' );

        repo.on( 'output', function( stdo, stde ) {
            output += stdo + ' ' + stde + ' ';
        } );

        repo.on( 'state', function( state ) {
            states += state + ' ';
        } );

        repo.on( 'error', function( error ) {
            console.log(error);
            true.should.be.false;           
        } );

        repo.on( 'updateDone', function() {

            output = output.replace(/[\n\r]*/g, '').replace( /\s+/g, ' ' ).trim();
            states = states.replace(/[\n\r]*/g, '').replace( /\s+/g, ' ' ).trim();
            
            output.should.equal( 'add * commit -m Auto build' );
            states.should.equal( 'Updating local repository Copying source files Commit to local master' );

            fs.existsSync( __dirname + '/../.herokuDeploy/node_modules' ).should.be.false;
            fs.existsSync( __dirname + '/../.herokuDeploy/.git' ).should.be.false;
            fs.existsSync( __dirname + '/../.herokuDeploy/.herokuDeploy' ).should.be.false;
            fs.existsSync( __dirname + '/../.herokuDeploy/lib' ).should.be.true;
            fs.existsSync( __dirname + '/../.herokuDeploy/tests' ).should.be.false;

            fakes.verify();
            done();
        } );

        repo.updateRepo();
        
    });

    test('updateRepo - error', function (done) {

        var config = {
            "baseFolder": "",
            "ignoreFoldersTestRun": [ ".git", "node_modules", "deploy" ],
            "ignoreFoldersDeploy": [ ".git", "node_modules", "deploy", "tests" ],
            "webrootFolder": "public"
        };

        fakes.mock( conf ).expects( 'get' ).withArgs( 'build' ).returns( config );
        
        var app = 'my-app',
            token = 'iamtoken',
            output = '',
            states = '';

        var repo = new herokuRepo( token, conf, app );
        repo.gitCmd = 'notacommand ';

        repo.on( 'output', function( stdo, stde ) {
            output += stdo + ' ' + stde + ' ';
        } );

        repo.on( 'state', function( state ) {
            states += state + ' ';
        } );

        repo.on( 'checkoutDone', function() {
            true.should.be.false;            
        } );

        repo.on( 'error', function( error ) {
            
            error.stderr.should.containEql( 'notacommand' );

            fakes.verify();
            done();
        } );

        repo.updateRepo();
        
    });

    test('deploy', function (done) {
        this.timeout(10000);

        var config = {
            "baseFolder": "",
            "ignoreFoldersTestRun": [ ".git", "node_modules", "deploy" ],
            "ignoreFoldersDeploy": [ ".git", "node_modules", "deploy", "tests" ],
            "webrootFolder": "public"
        };

        fakes.mock( conf ).expects( 'get' ).withArgs( 'build' ).returns( config );
        
        var app = 'my-app',
            token = 'iamtoken',
            output = '',
            states = '',
            folder = path.join( __dirname, '..', '.herokuDeploy' );

        fs.ensureDirSync( folder );

        var repo = new herokuRepo( token, conf, app );
        repo.gitCmd = 'node ' + path.join( __dirname , 'helpers', 'gitcmd.js' );

        repo.on( 'output', function( stdo, stde ) {
            output += stdo + ' ' + stde + ' ';
        } );

        repo.on( 'state', function( state ) {
            states += state + ' ';
        } );

        repo.on( 'error', function( error ) {
            console.log(error);
            true.should.be.false;           
        } );

        repo.on( 'deployDone', function() {

            output = output.replace(/[\n\r]*/g, '').replace( /\s+/g, ' ' ).trim();
            states = states.replace(/[\n\r]*/g, '').replace( /\s+/g, ' ' ).trim();

            output.should.equal( 'push heroku master -f -v undefined' );
            states.should.equal( 'Deploying to Heroku' );

            fs.existsSync( folder ).should.be.false;

            fakes.verify();
            done();
        } );

        repo.deploy();
        
    });

    test('deploy - error', function (done) {

        var config = {
            "baseFolder": "",
            "ignoreFoldersTestRun": [ ".git", "node_modules", "deploy" ],
            "ignoreFoldersDeploy": [ ".git", "node_modules", "deploy", "tests" ],
            "webrootFolder": "public"
        };

        fakes.mock( conf ).expects( 'get' ).withArgs( 'build' ).returns( config );
        
        var app = 'my-app',
            token = 'iamtoken',
            output = '',
            states = '',
            folder = path.join( __dirname, '..', '.herokuDeploy' );

        var repo = new herokuRepo( token, conf, app );
        repo.gitCmd = 'notacommand ';

        repo.on( 'output', function( stdo, stde ) {
            output += stdo + ' ' + stde + ' ';
        } );

        repo.on( 'state', function( state ) {
            states += state + ' ';
        } );

        repo.on( 'error', function( error ) {
            error.message.should.containEql( 'ENOENT' );

            fakes.verify();
            done();
        } );

        repo.deploy();
        
    });

});