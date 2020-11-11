# AuthKit
A small JSON microservice API for identity and session management with tokens. Built on sqlite3 and Redis.

## Setup
1. Install and run redis locally on the default port
2. ```npm install```
3. Create an environment variable string ```SECRET``` to use for the routes.
4. ```node server.js```

## Routes
HTTP Route|HTTP Method|Parameters|Return type|HTTP Status Exceptions|Description|
|------------|-------------|-------------|----------|-----------|----------|
|/create_identity|POST|`{secret, email, password}`| `{success}` |**503** On general database error <br> **400** when any paramter is invalid/missing<br> **401** if secret is incorrect <br>**409** if email is already registered|Registers a user with the service|
|/create_token|POST|`{secret, email, password}`| `{token}` |**503** On general database error <br> **400** when any paramter is invalid/missing<br> **401** If <ul><li>email/password combination is incorrect</li><li>secret is incorrect</li></ul>|Generates a session token|
|/verify_token|POST|`{token}`| `{success}` |**503** On general database error <br> **400** when any paramter is invalid/missing<br> **401** If token is invalid|Verifies that a given token is valid|

### Todo
- Token revocation
- Time stamped tokens with expiry date
- **400** errors if API params missing
