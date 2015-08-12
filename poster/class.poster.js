//== Globals
var _          = require('lodash'),
    com        = require('serialport'),
    request    = require('request'),
    SerialPort = com.SerialPort;

/**
 * @param config            {object}
 * @param config.url        {object}
 * @param config.interval   {object}
 * @constructor
 */
var Poster = function ( config ) {

    console.info('Staring Poster');

    var self = this;

    this.config     = config;
    this.serialPort = new SerialPort("/dev/ttyUSB0",
        {
            "baudrate": 9600,
            "databits": 7,
            "parity":   'even',
            "parser":   com.parsers.readline('\r\n', 'ascii')
        });

    this.postMessage = _.throttle(function ( message ) {
            self.post(message)
        }, self.config.interval
    );

    //== Start reading data
    this.start();
};

/** Activate posting on this.config.interval
 *  @private
 */
Poster.prototype.start = function () {

    console.info('Starting Poster.read()', 'Will post every', this.config.interval, 'ms');

    var self = this;

    this.messageBuilder = [];

    this.firstPassOk = false;

    this.serialPort.on('open', function () {

        console.info('Serial port opened');

        self.serialPort.on('data', function ( data ) {

            //== Add to message
            if ( self.firstPassOk === true ) {
                self.messageBuilder.push(data);
            }

            //== End of message
            if ( data == '!' && self.firstPassOk === true ) {

                self.parseMessage(self.messageBuilder);

                //== Reset message
                self.messageBuilder = [];

            } else if ( data == '!' ) {
                console.info('First message ending received. Capture can start.');
                self.firstPassOk = true;
            }
        });
    });
};

/** Parse the message
 * @param message {Array} Array of message lines
 *  @private
 */
Poster.prototype.parseMessage = function ( message ) {

    /** [Message to parse]
     0-0:96.1.1(4B414C37303035313738373238363133);
     1-0:1.8.1(01466.548*kWh);
     1-0:1.8.2(01725.716*kWh);
     1-0:2.8.1(00000.000*kWh);
     1-0:2.8.2(00000.001*kWh);
     0-0:96.14.0(0002);
     1-0:1.7.0(0000.55*kW);
     1-0:2.7.0(0000.00*kW);
     0-0:17.0.0(0999.00*kW);
     0-0:96.3.10(1);
     0-0:96.13.1();
     0-0:96.13.0();
     0-1:24.1.0(3);
     0-1:96.1.0(4730303135353631313037333538353133);
     0-1:24.3.0(150128150000)(00)(60)(1)(0-1:24.2.1)(m3);
     (00710.705);
     0-1:24.4.0(1);
     !;
     */

    var data = {
        "device":        message[0],
        "totalLow":      parseValue(message[3]).value,
        "totalHigh":     parseValue(message[4]).value,
        "returnLow":     parseValue(message[5]),
        "returnHigh":    parseValue(message[6]),
        "lowOrHigh":     parseValueInt(message[7]),
        "currentUse":    parseValue(message[8]).value,
        "currentReturn": parseValue(message[9]),
        "maxPower":      parseValue(message[10]),
        "gasId":         parseValueInt(message[15]),
        "gasTime":       parseValueInt(message[16]),
        "gasUse":        parseValueInt(message[17]),
        "gasValve":      parseValueInt(message[18]),
        "original":      message
    };

    console.log('Message parsed, ready to post.');

    this.postMessage(data);

    return data;
};

/** Post to this.config.url
 *
 */
Poster.prototype.post = function ( message ) {
    console.info('Posting message', this.config.url);
    request.post(this.config.url, { form: message }, function ( error, response, body ) {
        if ( error ) {
            console.error('Error while posting', error);
            console.error('body:', body);
        } else {
            console.info('Post OK', body);
        }
    });
};

//== Export
module.exports = Poster;

//== Parse functions
function parseValue( value ) {
    return {
        value: parseFloat(value.replace(/(.+)\(([0-9\.]*)\*?(.+)\)/, '$2')),
        unit:  value.replace(/(.+)\(([0-9\.]*)\*?(.+)\)/, '$3')
    }
}

function parseValueInt( value ) {
    var returnValue = value.match(/\(([0-9\.]+)\)/)[1];
    return parseFloat(returnValue);
}