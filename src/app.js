var express = require('express');
var path = require('path');
var osprey = require('osprey');

var robot = require('./robot');
var populateMotionData = require('./populateMotionData');

var app = module.exports = express();

app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.compress());
app.use(express.logger('dev'));

app.set('port', process.env.PORT || 3000);

function normalizeCommandName(name)
{
    return name.replace(/\s+/g, '').toLowerCase();
}

var motionData = {};
populateMotionData(motionData, normalizeCommandName);

api = osprey.create('/api', app, 
{
  ramlFile: path.join(__dirname, '/assets/raml/api.raml'),
  logLevel: 'debug'  //  logLevel: off->No logs | info->Show Osprey modules initializations | debug->Show all
});

// GET information about the commands
api.get('/robots/:robotId/commands', function (req, res) 
{
    res.send(motionData);
});

// POST a command for the robot to execute
api.post('/robots/:robotId/commands', function (req, res) 
{
    try 
    {

        var robotId = req.params.robotId;
        var commandNumber = req.param('number');
        var commandName = req.param('name');
        var normalizedCommandName = normalizeCommandName(commandName);

        if (commandName && !commandNumber)
        {
            commandNumber = motionData.flowsByName[normalizedCommandName];
            if (!commandNumber)
            {
                res.status(422).send({ error: 'Unrecognized command name' });
                return;
            }
        }
        
        if (commandNumber in motionData.flowsByNumber)
        {
            var command = motionData.flowsByNumber[commandNumber];
            console.info('Executing command: ' + command.name + ' for ' + command.time + 'ms');
            robot.connect(robotId, function onConnect(err)
            {
                if (err)
                {
                    res.status(500).send({ error: err });
                }
                else
                {
                    robot.sendCommand(Number(commandNumber));
                    setTimeout(function () { res.status(202).send(''); }, command.time);
                }
            });
        }
        else
        {
            res.status(422).send({ error: 'Unrecognized command number' });
        }

    } 
    catch (e) 
    { 
        console.error(e); 
        res.status(500).send(''); 
    }

});

// GET the state of the robot by reading the control table at a certain address
// DOES NOT WORK RIGHT YET
// Only asks the robot to read the data, but the data itself is only logged and not returned
api.get('/robots/:robotId/state', function (req, res) 
{
    var robotId = req.params.robotId;
    var address = Number(req.param('address'));
    var bytesToRead = Number(req.param('bytesToRead'));
    console.info('Reading state: ' + [ address, bytesToRead ]);
    robot.connect(robotId, function onConnect(err)
    {
        if (err)
        {
            res.status(500).send({ error: err });
        }
        else
        {
            robot.readState(address, bytesToRead);
            res.status(202).send('');
        }
    });
});

if (!module.parent) 
{
  var port = app.get('port');
  app.listen(port);
  console.log('listening on port ' + port);
}