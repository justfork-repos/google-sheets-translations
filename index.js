const { GoogleSpreadsheet } = require('google-spreadsheet');
const Promise = require('bluebird');

var WorksheetTranslations = require('./worksheet-translations');

async function getTranslationsFromSpreadsheet(doc) {
    await doc.loadInfo();
    const sheets = doc.sheetsByIndex || [];
    const results = await Promise.mapSeries(sheets, (sheet) =>
        getTranslationsFromWorksheet(sheet)
    );
    return results;
}

async function getTranslationsFromWorksheet(worksheet) {
    console.log('Getting translations for : ' + worksheet.title);
    const rows = await worksheet.getRows();
    var translations = {};
    var locales = [];
    rows.forEach(function(row) {
        var token = row.token;
        if (token) {
            if (translations[token]) {
                console.warn(
                    'Overriding duplicate translation for: ' +
                        token +
                        ' in worksheet: ' +
                        worksheet.title
                );
            }
            translations[token] = {};
            Object.keys(row)
                .filter(function(key) {
                    return typeof row[key] != 'function';
                })
                .filter(isValidLocale)
                .forEach(function(locale) {
                    if (locales.indexOf(locale) === -1) {
                        locales.push(locale);
                    }
                    translations[token][locale] = row[locale];
                });
        } else {
            console.error(
                'Column "token" is not defined for worksheet ' + worksheet.title
            );
        }
    });
    return new WorksheetTranslations(worksheet.title, translations, locales);
}

async function updateWorksheetTokens(worksheet, tokens) {
    console.log('Updating translation tokens for : ' + worksheet.title);
    const rows = await worksheet.getRows();
    var currentTokens = rows
        .map(function(row) {
            return row.token;
        })
        .filter(function(token) {
            return token && token.length;
        });
    var missingTokens = tokens.filter(function(token) {
        return currentTokens.indexOf(token) === -1;
    });
    console.log(
        'Following tokens were missing in the translations spreadsheet: ' +
            missingTokens.join(',')
    );
    const results = await Promise.mapSeries(missingTokens, async (token) => {
        console.log('Adding token: ' + token);
        return await worksheet.addRow({ token });
    });
    return results;
}

function isValidLocale(locale) {
    return (
        locale !== 'id' &&
        locale !== 'token' &&
        /^[a-zA-Z]+([_-][a-zA-Z]+)?$/.test(locale)
    );
}

async function updateSpreadsheetWithTranslations(doc, spreadsheetTranslations) {
    async function addTranslations(worksheetTranslations) {
        const results = await addWorksheetTranslations(
            doc,
            worksheetTranslations
        );
        return results;
    }
    return Promise.mapSeries(spreadsheetTranslations, (worksheetTranslations) =>
        addTranslations(worksheetTranslations)
    );
}

async function updateSpreadsheetWithTokens(doc, tokens) {
    await doc.loadInfo();
    console.log('Loaded doc: ' + doc.title);

    const results = await Promise.mapSeries(doc.sheetsByIndex, (sheet) =>
        updateWorksheetTokens(sheet, tokens)
    );
    return results;
}

async function addWorksheetTranslations(doc, worksheetTranslations) {
    var headers = [].concat('token', worksheetTranslations.getLocales());

    const worksheet = await doc.addWorksheet({
        title: worksheetTranslations.getTitle(),
        headers: headers,
    });
    const results = await Promise.mapSeries(
        worksheetTranslations.getTokens(),
        async (token) => {
            var translations = worksheetTranslations.getTranslationsForToken(
                token
            );
            translations['token'] = token;
            const result = await worksheet.addRow(translations);
            return result;
        }
    );

    return results;
}

module.exports.createTranslationsSpreadsheet = async function(
    spreadsheetId,
    spreadsheetTranslations,
    credentials,
    cb
) {
    if (!credentials || typeof credentials === 'function') {
        throw new Error('Must provide credentials');
    } else {
        try {
            var doc = new GoogleSpreadsheet(spreadsheetId);
            await doc.useServiceAccountAuth(credentials);
            const results = await updateSpreadsheetWithTranslations(
                doc,
                spreadsheetTranslations
            );
            cb(null, results);
        } catch (err) {
            cb(err);
        }
    }
};

module.exports.loadTranslations = async function(
    spreadsheetId,
    credentials,
    cb
) {
    if (!credentials || typeof credentials === 'function') {
        throw new Error('Must provide credentials');
    } else {
        try {
            const doc = new GoogleSpreadsheet(spreadsheetId);
            await doc.useServiceAccountAuth(credentials);
            const results = await getTranslationsFromSpreadsheet(doc);
            cb(null, results);
        } catch (err) {
            console.log('------');
            console.log(err);
            console.log('-----');
            console.log(cb);
            cb(err);
        }
    }
};

module.exports.updateTokens = async function(
    spreadsheetId,
    tokens,
    credentials,
    cb
) {
    if (!credentials || typeof credentials === 'function') {
        throw new Error('Must provide credentials');
    } else {
        try {
            var doc = new GoogleSpreadsheet(spreadsheetId);
            await doc.useServiceAccountAuth(credentials);
            const results = await updateSpreadsheetWithTokens(doc, tokens);
            cb(null, results);
        } catch (err) {
            cb(err);
        }
    }
};

module.exports.WorksheetTranslations = WorksheetTranslations;
