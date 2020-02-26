
var spreadsheetId = '1nqqJ2K-nh4oOi8funlJkDVNOqFDQgn2UBcEV-m2bsrI';
var spreadsheetTranslations = require('../index');
var fs = require('fs');
const credentials = require('../test-credentials.json');

spreadsheetTranslations.loadTranslations(spreadsheetId, credentials, function(error, spreadsheetTranslations) {
	if (error) {
		console.error(error);
	} else {
		spreadsheetTranslations.forEach(function(worksheetTranslations) {
			var brand = worksheetTranslations.getTitle();
			worksheetTranslations.getLocales().forEach(function(locale) {
				var filename = __dirname + '/data/' + brand.toUpperCase() + '.' + locale + '.json'; 
				fs.writeFileSync(filename, JSON.stringify(worksheetTranslations.getTranslationsForLocale(locale), null, 4));
			})
		});
	}
});
