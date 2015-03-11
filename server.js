var argv    = require('minimist')(process.argv.slice(2)),
    express = require('express'),
    morgan  = require('morgan'),
    parser  = require('raml-parser'),
    app     = express();

var RESULT_INTENT_HEADER = 'X-Mock-Result';

/**
 * Only accept a single source RAML document.
 */
if (argv._.length !== 1) {
    console.log("Only one single RAML file may be specified.");
    process.exit(1);
}

/**
 * Setup logging for the Express app server.
 */
app.use(morgan('combined'));

/**
 * Parse the RAML document specified.
 */
parser.loadFile(argv._[0]).then(function(data) {
    console.log("Found " + data.resources.length + " resources in RAML document " + argv._[0]);
    data.resources.forEach(function(resource) {
        registerResource(resource, '');
    });
}, function(error) {
    console.error('Error parsing: ' + error);
});

/**
 * Register an API resource, as parsed by the RAML parser.
 */
function registerResource(resource, basePath) {
    // register a route for each resource method
    resource.methods.forEach(function mth(method) {
        var url = basePath + resource.relativeUri;
        url = url.replace(/{([^}]+)}/ig, ":$1");

        console.log("Registering route " + method.method.toUpperCase() + " " + url);
        app[method.method](url, handler(resource, method));
    });

    // register any child resources if present
    if (resource.resources) {
        resource.resources.forEach(function(child) {
            registerResource(child, basePath + resource.relativeUri);
        });
    }
}

/**
 * Generate an Express handler function for a resource.
 */
function handler(resource, method) {
    return function(req, resp, next) {
        var status = null;
        if (req.get(RESULT_INTENT_HEADER) && parseInt(req.get(RESULT_INTENT_HEADER)) !== NaN) {
            status = parseInt(req.get(RESULT_INTENT_HEADER));
        }

        if (!status) {
            status = Object.keys(method.responses)[0];
        }

        if (method.responses && method.responses.hasOwnProperty(status)) {
            for (contentType in method.responses[status].body) {
                if (req.accepts(contentType)) {
                    resp.status(200).type(contentType).send(method.responses[status].body[contentType].example);
                } else {
                    resp.status(406).end();
                }
            }
        } else {
            resp.status(400).send("Cannot produce a mocked response for status " + status);
        }        
    };
}

var port = argv['p'] || 8080;
app.listen(port, function() {
    console.log("Express server started and listening on port " + port);
});
