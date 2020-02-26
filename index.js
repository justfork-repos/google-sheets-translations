const {GoogleSpreadsheet} = require('google-spreadsheet');
var async = require('async');
var WorksheetTranslations = require('./worksheet-translations');

async function getTranslationsFromSpreadsheet(doc) {
    // try {
        const info = await doc.loadInfo();
        //async.map(doc.sheetsByIndex, getTranslationsFromWorksheet, cb);
        const results = await Promise.all(doc.sheetsByIndex.map(sheet => getTranslationsFromWorksheet(sheet)));
        return results;

    // } catch(err) {
    //     throw new Er
    // }    
    // doc.getInfo(function(err, info) {
    //     if (err) {
    //         cb(err);
    //     } else {
    //         console.log('Loaded doc: ' + info.title);  
    //           async.map(info.worksheets, getTranslationsFromWorksheet, cb);

    //       }
    // });
}

async function getTranslationsFromWorksheet(worksheet) {
    console.log('Getting translations for : ' + worksheet.title);
    // try {
        const rows = await worksheet.getRows();
        var translations = {};
        var locales = [];
        rows.forEach( function(row) {
            var token = row.token;
            if (token) {
                if (translations[token]) {
                    console.warn('Overriding duplicate translation for: ' + token + ' in worksheet: ' + worksheet.title);
                }
                translations[token] = {};
                Object.keys(row)
                .filter(function(key) {
                    return typeof row[key] != 'function';
                })
                .filter(isValidLocale)
                .forEach( function(locale){
                    if (locales.indexOf(locale) === -1) {
                        locales.push(locale);
                    }
                    translations[token][locale] = row[locale];
                });
            } else {
                console.error('Column "token" is not defined for worksheet ' + worksheet.title);
            }
        });
        return new WorksheetTranslations(worksheet.title, translations, locales);
    // } catch (err) {
    //     cb(err);
    // }
    // worksheet.getRows({}, function(err, rows) {
    //     if (err) {
    //         cb(err)
    //     } else {
    //         // var translations = {};
    //         // var locales = [];
    //         // rows.forEach( function(row) {
    //         //     var token = row.token;
    //         //     if (token) {
    //         //         if (translations[token]) {
    //         //             console.warn('Overriding duplicate translation for: ' + token + ' in worksheet: ' + worksheet.title);
    //         //         }
    //         //         translations[token] = {};
    //         //         Object.keys(row)
    //         //         .filter(function(key) {
    //         //             return typeof row[key] != 'function';
    //         //         })
    //         //         .filter(isValidLocale)
    //         //         .forEach( function(locale){
    //         //             if (locales.indexOf(locale) === -1) {
    //         //                 locales.push(locale);
    //         //             }
    //         //             translations[token][locale] = row[locale];
    //         //         });
    //         //     } else {
    //         //         console.error('Column "token" is not defined for worksheet ' + worksheet.title);
    //         //     }
    //         // });
    //         // cb(null, new WorksheetTranslations(worksheet.title, translations, locales));
    //     }
    // });
}

async function updateWorksheetTokens(worksheet, tokens, cb) {
    console.log('Updating translation tokens for : ' + worksheet.title);
   const rows = await worksheet.getRows();
    var currentTokens = rows.map(function(row) {
        return row.token;
    }).filter(function(token){
        return token && token.length;
    });
    var missingTokens = tokens.filter(function(token) {
        return currentTokens.indexOf(token) === -1;
    });
    console.log('Following tokens were missing in the translations spreadsheet: ' + missingTokens.join(','));
    const results = await Promise.all(missingTokens.map(async (token) => {
        console.log('Adding token: ' + token);
        return await worksheet.addRow({token});
    }));
    return results;
    // worksheet.getRows({}, function(err, rows) {
    //     if (err) {
    //         cb(err)
    //     } else {
    //         var currentTokens = rows.map(function(row) {
    //             return row.token;
    //         }).filter(function(token){
    //             return token && token.length;
    //         });
    //         var missingTokens = tokens.filter(function(token) {
    //             return currentTokens.indexOf(token) === -1;
    //         });

    //         console.log('Following tokens were missing in the translations spreadsheet: ' + missingTokens.join(','));

    //         async.eachSeries(missingTokens, function(token, next) {
    //             console.log('Adding token: ' + token);

    //             worksheet.addRow({'token': token}, next);
    //         }, cb);
    //     }
    // });
}


function isValidLocale(locale) {
    //return locale !== 'id' && /^[a-zA-Z]{2}(_[a-zA-Z]{2})?$/.test(locale);
    return locale !== 'id' && locale !== 'token' && /^[a-zA-Z]+([_-][a-zA-Z]+)?$/.test(locale);
}

async function updateSpreadsheetWithTranslations(doc, spreadsheetTranslations) {
    async function addTranslations(worksheetTranslations) {
        const results = await addWorksheetTranslations(doc, worksheetTranslations);
        return results;
    }
    return Promise.all(spreadsheetTranslations.map(worksheetTranslations => addTranslations(worksheetTranslations)));
}

async function updateSpreadsheetWithTokens(doc, tokens) {
    await doc.getInfo();
    console.log('Loaded doc: ' + doc.title);
    
    const results = await Promise.all(doc.sheetsByIndex.map(sheet => updateWorksheetTokens(sheet, tokens)));
    return results;
    // doc.getInfo(function(err, info) {
    //     if (err) {
    //         cb(err);
    //     } else {
    //         console.log('Loaded doc: ' + info.title);
    //         async.map(info.worksheets, function(worksheet, next) {
    //             updateWorksheetTokens(worksheet, tokens, next);
    //         }, cb);
    //     }
    // });
}


async function addWorksheetTranslations(doc, worksheetTranslations, cb) {
    var headers = [].concat('token', worksheetTranslations.getLocales());

    const worksheet = await doc.addWorksheet({title: worksheetTranslations.getTitle(),headers: headers});
    const results = await Promise.all(worksheetTranslations.getTokens().map(async (token) => {
        var translations = worksheetTranslations.getTranslationsForToken(token);
        translations['token'] = token;
        const result = await worksheet.addRow(translations);
        return result;
    }));
    return results;
    // var worksheet;
    // async.series([
    //     function(next) {
    //         doc.addWorksheet({
    //                 title: worksheetTranslations.getTitle(),
    //                 headers: headers},
    //             function(error, sheet) {
    //                 if (error) {
    //                     next(error);
    //                 } else {
    //                     worksheet = sheet;
    //                     next();
    //                 }
    //             }
    //         )
    //     },
    //     function(next) {
    //        async.eachSeries(worksheetTranslations.getTokens(), function(token, next) {
    //            var translations = worksheetTranslations.getTranslationsForToken(token);
    //            translations['token'] = token;
    //           worksheet.addRow(translations, next);
    //        }, next)
    //     }
    // ], cb);
}

module.exports.createTranslationsSpreadsheet = async function(spreadsheetId, spreadsheetTranslations, credentials, cb) {
    if (typeof credentials === 'function') {
        throw new Error('Must provide credentials');
    } else {
        try {
            var doc = new GoogleSpreadsheet(spreadsheetId);
            await doc.useServiceAccountAuth(credentials);
            const results = await updateSpreadsheetWithTranslations(doc, spreadsheetTranslations);
            cb(null, results);
        } catch(err) {
            cb(err);
        }
    }
};

module.exports.loadTranslations = async function(spreadsheetId, credentials, cb) {
    if (typeof credentials === 'function') {
        throw new Error('Must provide credentials');
    } else {
        try {
            var doc = new GoogleSpreadsheet(spreadsheetId);
            await doc.useServiceAccountAuth(credentials);
            const results = await getTranslationsFromSpreadsheet(doc);
            cb(null, results);
        } catch(err) {
            cb(err);
        }
    }
};

module.exports.updateTokens = async function(spreadsheetId, tokens, credentials, cb) {
    if (typeof credentials === 'function') {
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
        
        
        // await doc.useServiceAccountAuth(credentials);
        // doc.useServiceAccountAuth(credentials, function(error) {
        //     if (error) {
        //         cb(error)
        //     } else {
        //         updateSpreadsheetWithTokens(doc, tokens, cb);
        //     }
        // });
    }
};

module.exports.WorksheetTranslations = WorksheetTranslations;
