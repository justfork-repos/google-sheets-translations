
var spreadsheetId = '1nqqJ2K-nh4oOi8funlJkDVNOqFDQgn2UBcEV-m2bsrI';
var spreadsheetTranslations = require('../index');
var WorksheetTranslations = spreadsheetTranslations.WorksheetTranslations;
var fs = require('fs');
const credentials = require('../test-credentials.json');



var worksheetTranslations = new WorksheetTranslations('TEST');

worksheetTranslations.addLocale('en_US', require('./TEST.en_US.json'));
worksheetTranslations.addLocale('de_DE', require('./TEST.de_DE.json'));

spreadsheetTranslations.createTranslationsSpreadsheet(spreadsheetId, [worksheetTranslations], credentials, function(error) {
	if (error) {
		console.error(error);
	} else {
		console.log('success');
	}
});
