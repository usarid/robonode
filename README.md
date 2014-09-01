robonode
========

A RAML-described, node-based RESTful API for the Robotis DARWIN-MINI robot

It uses RAML, node.js, the Express framework, and Osprey to describe and implement the API.

The flow is simple: start the server, which then listens for HTTP requests, and 
issues the appropriate binary commands over bluetooth to the robot.

Only tested on a Mac running the Mavericks version of OSX and a single bluetooth-paired DARWIN-MINI.

Installation
------------

    npm install

You must also have paired your DARWIN-MINI with your Mac via bluetooth.

Optional Installation
---------------------

Since the API is running on your desktop, you might want to expose it on the
internet, to make it easier to use tools like the [API Notebook](http://apinotebook.com).
The easiest way I've found is [ngrok](http://ngrok.com). Simply download and unzip
to somewhere on your filesystem, choose some random subdomain you'd like to use
for your API (say `robo123`), then run:

    ./ngrok -subdomain robo123 3000

Change the value of `baseUri` in the src/assets/raml/api.raml file to be 
`http://robo123.ngrok.com/api` and now that's the internet entrypoint to your API!

_I've signed up and paid a bit to [ngrok](http://ngrok.com) to reserve my own domain; 
you might choose to do the same so your RAML file is constant._

Usage
-----

To start the server, simply type

    grunt

or alternatively

    node src/app.js

Your API is available at http://localhost:3000/api and an API console is available
at http://localhost:3000/api/console . The API definition in RAML is available
at http://localhost:3000/api/api.raml -- see http://raml.org for more information.

You can now issue individual commands to your robot using the API Console or any other
tool such as the API Notebook, or even just curl from the commandline:

    curl http://localhost:3000/api/robots

    [
      {
        "name": "ROBOTIS BT-210",
        "address": "b8-63-bc-00-12-16",
        "services": [
          {
            "channel": 1,
            "name": "SPP Dev"
          }
        ],
        "robotId": "1216"
      }
    ]

    curl -H "Content-Type: application/json" -d '{ "name": "Sit" }' \ 
         http://localhost:3000/api/robots/1216/commands

Note that you must pair with the robot(s) but you need not connect with them; this server
will connect for you. So the first command you issue may take a bit longer,
while establishing the connection, but subsequent ones will reuse the connection if it's
still open. Occasionally, you might need to restart the server if it thinks it's still
connected to the robots but they think otherwise.

The API commands are designed to return only once the robot has finished executing the command,
which they accomplish by calculating how much time is allotted for the command in the motion file.
So if you want to string multiple commands together, make sure you wait for each response to return
before issuing the subsequent request.

