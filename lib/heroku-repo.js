'use strict'

var fs         = require('fs-extended'),
    path        = require('path'),
    execPromise = require('child-process-promise').exec,
    exec        = require('child_process').exec,
    util        = require( 'util' ),
    EventEmitter = require( 'events').EventEmitter;

function herokuRepo( herokuToken, conf, appName ) {
    this.token = herokuToken;
    this.build = conf.get( 'build' );
    this.cwd = process.cwd();
    this.src = path.join( this.cwd, this.build.baseFolder );
    this.folder = path.join( this.cwd, '.herokuDeploy' );
    this.webroot = this.build.webrootFolder || false;
    this.appName = appName;
    this.gitCmd = 'git';
}

util.inherits( herokuRepo, EventEmitter );

herokuRepo.prototype.checkout = function() {
    var that = this;
    var execOpts = {cwd: this.folder};

    this.emit( 'state', 'Creating temporary deployment folder' );
    try {
        fs.deleteDirSync( this.folder );
    } catch( e ) {
        this.emit( 'error', e );
        return;
    }

    fs.ensureDirSync( this.folder );

    this.emit( 'state', 'Initialize git repo' );

    execPromise( that.gitCmd + ' init .', execOpts )
        .then( function( result ) {
            that.emit( 'output', result.stdout, result.stderr );
            that.emit( 'state', 'Set git user' );
            return execPromise( that.gitCmd + ' config user.email "deploy@example.com" && ' + that.gitCmd + ' config user.name "Heroku Deployment Script"', execOpts );
        } )
        .then( function( result ) {
            that.emit( 'output', result.stdout, result.stderr );
            that.emit( 'state', 'Add Heroku remote' );
            return execPromise( that.gitCmd + ' remote add heroku https://user:' + that.token + '@git.heroku.com/' + that.appName + '.git', execOpts );
        } )
        .then( function( result ) {
            that.emit( 'output', result.stdout, result.stderr );
            that.emit( 'state', 'Pull Heroku master' );
            return execPromise( that.gitCmd + ' pull heroku master', execOpts );
        } )
        .then( function( result ) {
            that.emit( 'output', result.stdout, result.stderr );
            that.emit( 'checkoutDone' );
        } )
        .catch( function ( err ) {
            if ( err.message.indexOf( 'Couldn\'t find remote ref master' ) == -1 ) {
                that.emit( 'error', err );
                return;
            }
            that.emit( 'warning', 'No remote master branch detected' );
            that.emit( 'checkoutDone' );
        });

    return this;
}

herokuRepo.prototype.updateRepo = function( testBuild ) {
    this.emit( 'state', 'Updating local repository' );

    var that   = this;
    var execOpts = {cwd: this.folder};
    var aClean = ( testBuild ) ? this.build.ignoreFoldersTestRun : this.build.ignoreFoldersDeploy;
    
    aClean.push( '.herokuDeploy' );

    var files = fs.listFilesSync( this.src, {
        recursive: true,
        filter: function( sName ) {
            var bOk = true;
            aClean.forEach( function( sExclName ) {
                sName += path.sep;
                if ( sName.indexOf( path.sep + sExclName + path.sep ) != -1 ) {
                    bOk = false;
                }
            } );
            return bOk;
        }

    });

    that.emit( 'state', 'Copying source files' );

    files.forEach( function( sName ) {
        fs.copyFileSync( path.join( that.src, sName ), path.join( that.folder, sName ) );
    });

    that.emit( 'state', 'Commit to local master' );

    execPromise( that.gitCmd + ' add *', execOpts )
        .then( function( result ) {
            that.emit( 'output', result.stdout, result.stderr );
            return execPromise( that.gitCmd + ' commit -m "Auto build"', execOpts );
        } )
        .then( function( result ) {
            that.emit( 'output', result.stdout, result.stderr );
            that.emit( 'updateDone' );
        } )
        .catch( function ( err ) {
            if ( err.stdout.indexOf( 'nothing to commit' ) == -1 ) {
                that.emit( 'error', err );
                return;
            }
            that.emit( 'warning', 'No changes detected' );
            that.emit( 'updateDone' );
        });

    return this;
}

herokuRepo.prototype.deploy = function() {
    var that = this;
    var job  = exec( this.gitCmd + ' push heroku master -f -v', { 'cwd': this.folder, maxBuffer: 5000 * 1024 } );

    that.emit( 'state', 'Deploying to Heroku' );

    job.stdout.on('data', function (data) {
        that.emit( 'output', data.toString() );
    });

    job.stderr.on('data', function (data) {
        that.emit( 'output', '', data.toString() );
    });

    job.on('close', function ( code ) {

        try {
            fs.deleteDirSync( that.folder );
        } catch( e ) {
             that.emit( 'warning', 'Cannot remove temp folder ' + e.message );
        }
        that.emit( 'deployDone', code );
    });

    job.on('error', function ( err ) {
        that.emit( 'error', err );
    });

    return this;
}

herokuRepo.prototype.clean = function() {
    var that = this;

    try {
        fs.deleteDirSync( that.folder );
    } catch( e ) {
         that.emit( 'warning', 'Cannot remove temp folder ' + e.message );
    }
    
    that.emit( 'cleaned' );
}

exports = module.exports = herokuRepo;