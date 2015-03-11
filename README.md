# ramlmock

A HTTP server that produces mock/example data specified by a RAML document.

Install ramlmock into the system `$ npm i -g ramlmock`, and then run `$ ramlmock` to see usage instructions.

The program accepts a single argument: the path to a RAML document. It passes this filename into [raml-parser](https://www.npmjs.com/package/raml-parser) to generate an AST of the API resources.

While iterating through each API resource identified in the RAML document, it will create [Express](http://expressjs.com/) routes, and start-up a HTTP web server that will respond to any routes described by the RAML specification, with the example representations specified by the RAML specification.

Optionally, each HTTP request may specify the `X-Mock-Result` header to indicate which response code is desired as the response. If the status code specified in this header is not specified by the RAML document, the server will return a 400 error with a plain-text message.
