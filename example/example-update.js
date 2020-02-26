
var spreadsheetId = '1nqqJ2K-nh4oOi8funlJkDVNOqFDQgn2UBcEV-m2bsrI';
var spreadsheetTranslations = require('../index');
var fs = require('fs');
const credentials = require('../test-credentials.json');

var newTokens = [
    'TOKEN_' +Date.now(),
    'TOKEN2_' +Date.now()
];

spreadsheetTranslations.updateTokens(spreadsheetId, newTokens, credentials, function(error) {
	if (error) {
		console.error(error);
	} else {
		console.log('Success');
	}
});
