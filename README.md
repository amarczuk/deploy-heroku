#Heroku Deployment



Run options:

``` bash
$ node ./node_modules/heroku-deploy/lib/deploy.js <app>
```

Require *deploy.json* to be present in app's main folder:

``` json
{
    "herokuToken" : "xxxx",
    "build"  : {
        "baseFolder": "src",
        "ignoreFoldersTestRun": [ ".git", "node_modules", "deploy" ],
        "ignoreFoldersDeploy": [ ".git", "node_modules", "deploy", "tests" ],
        "webrootFolder": "public",
        "testCommand": "cd /app && npm test",
        "testResults": [ "tests/results/junit.xml" ],
        "postScripts": {
            "deploy/myModule": { "option": true, "option2": false }
        },
    },
    "apps"  : [
        {
            "name": "myapp-dev",
            "config": "./deploy/conf/dev.json",
            "processType": "standard-1X",
            "webWorkers": {
                "min": 1,
                "max": 1
            }
        },
        {
            "name": "myapp-ci",
            "config": "./deploy/conf/ci.json",
            "processType": "standard-1X",
            "webWorkers": {
                "min": 0,
                "max": 0
            }
        },
        {
            "name": "myapp-prod",
            "config": "./deploy/conf/prod.json",
            "processType": "standard-2X",
            "organization": "myorg",
            "webWorkers": {
                "min": 5,
                "max": 10

            }
        }
    ]
}
``` 
