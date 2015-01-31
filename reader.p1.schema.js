//== Requirements
var mongoose 	= require('mongoose'),
	Schema 		= mongoose.Schema;

//== Schema
var readerSchema = new Schema({
  date: { type: Date, default: Date.now },
  totalLow:      Number,
  totalHigh:     Number,
  lowOrHigh:     Number,
  currentUse:    Number,
  gasTime:       Number,
  gasUse:        Number,
  gasValve:      Number,
  original:      String,
});

var Reading = mongoose.model('Reading', readerSchema);

//== Export
module.exports = {Reading : Reading, readingSchema : readerSchema };
