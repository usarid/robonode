var btSerial = new (require('bluetooth-serial-port')).BluetoothSerialPort();
var addCRC = require('./addCRC');

var PREFIX = 'fffffd00'; // Defined by http://support.robotis.com/en/techsupport_eng.htm#product/dynamixel_pro/communication.htm
var DYNAMIXEL_ID = 'c8'; // Not sure why, but I'm told this is 200
var COMMAND_PACKET_LENGTH = '0700';
var STATE_PACKET_LENGTH = '0700';
var INSTRUCTION_READ = '02';
var INSTRUCTION_WRITE = '03';
var ADDRESS_EXECUTE = '4200'; // 66 decimal expressed in hex, low byte first; "66 is the address value that states the motion will be executed"

// Find the Robotis device among the paired devices, and connect to it
// robotId should be the last 4 characters of the bluetooth address of your Robotis device
// You can see its address on a Mac if you hold down 'option' while viewing the menu bar's bluetooth dropdown
// e.g. if the address is 'b8-63-bc-00-12-16' your robotId is 1216
exports.connect = function connect(robotId, onConnect)
{
    var dashedRobotId = robotId.substr(0, 2) + '-' + robotId.substr(2, 2);
    btSerial.listPairedDevices(function (pairedDevices)
    {
        var robotDevices = pairedDevices.filter(function (device) 
        { 
            return (device.name.search(/Robotis/i) != -1) &&
                   (device.address.substr(-5) == dashedRobotId);
        });

        if (robotDevices.length === 0)
        {
            onConnect('No robots found!');
        }
        else
        {
            if (robotDevices.length > 1) console.info('Found ' + robotDevices.length + ' robots; using the first');
            robot = robotDevices[0];
            channel = robot.services[0].channel;
            connectOne(robot.address, channel, onConnect);
        }
    });
};

// Actually connect to the device, on its address and channel
function connectOne(address, channel, onConnect)
{
    if (btSerial.isOpen())
    {
        console.info('already connected');
        onConnect();
    }
    else
    {
        console.info('connecting...');

        btSerial.connect(address, channel, function() 
        {
            console.info('connected');
            onConnect();

            // Log any returning data:
            btSerial.on('data', function (buffer) 
            {
                console.info('<< ' + buffer.toString('hex'));
            });

        }, function () 
        {
            onConnect('cannot connect');
        });
    }
}

function toHexLowHigh(number)
{
    var hex = (number + 0x10000).toString(16).substr(-4); // e.g. '0262'
    hexHigh = hex.substr(0, 2);
    hexLow  = hex.substr(2, 2);
    return hexLow + hexHigh;
}

// write a command to the bluetooth port
// command should be a number from 1-255
exports.sendCommand = function sendCommand(command, onSent)
{
    var hexCommand = toHexLowHigh(command);

    var packet = PREFIX + DYNAMIXEL_ID + COMMAND_PACKET_LENGTH + INSTRUCTION_WRITE + ADDRESS_EXECUTE + hexCommand;
    packet = addCRC(packet);
    console.info('Sending packet: ' + packet);

    btSerial.write(new Buffer(packet, 'hex'), function (err, bytesWritten) 
    {
        console.info('sent');
        if (err) console.error(err);
        if (onSent) onSent(err);
    });
};

// read a state from the bluetooth port
// address and lengthInBytes should be numbers
exports.readState = function readState(address, lengthInBytes, onSent)
{
    var addr16 = toHexLowHigh(address);
    var len16  = toHexLowHigh(lengthInBytes);

    var packet = PREFIX + DYNAMIXEL_ID + STATE_PACKET_LENGTH + INSTRUCTION_READ + addr16 + len16;
    packet = addCRC(packet);
    console.info('Sending packet: ' + packet);

    btSerial.write(new Buffer(packet, 'hex'), function (err, bytesWritten) 
    {
        console.info('sent');
        if (err) console.error(err);
        if (onSent) onSent(err);
    });
};
