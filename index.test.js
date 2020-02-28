const spreadsheetTranslations = require('./index');
const { GoogleSpreadsheet } = require('google-spreadsheet');
jest.genMockFromModule('google-spreadsheet');
jest.mock('google-spreadsheet');
describe('spreadsheetTranslations', () => {
    beforeEach(() => {
        GoogleSpreadsheet.mockClear();
    });
    describe('loadTranslations', () => {
        let mockGoogleSpreadsheetInstance;
        let mockWorksheets;
        beforeEach(() => {
            mockWorksheets = [
                {
                    title: 'JPARK',
                    getRows: jest.fn(() =>
                        Promise.resolve([
                            {
                                token: 'A_KEY',
                                en: 'A key',
                                fr: 'Une clé',
                            },
                            {
                                token: 'WELCOME',
                                en: 'Welcome... to Jurassic Park.',
                                fr: 'Bienvenue ... à Jurassic Park.',
                            },
                            {
                                token: 'KEY_EXISTS_FOR_EN_ONLY',
                                en:
                                    'This key has not been translated to french',
                            },
                        ])
                    ),
                },
                {
                    title: 'JAWS',
                    getRows: jest.fn(() =>
                        Promise.resolve([
                            {
                                token: 'A_KEY',
                                en: 'A key',
                                fr: 'Une clé',
                            },
                            {
                                token: 'WELCOME',
                                en: "You're gonna need a bigger boat!",
                                fr:
                                    "Tu vas avoir besoin d'un plus gros bateau!",
                            },
                        ])
                    ),
                },
            ];

            mockGoogleSpreadsheetInstance = {
                useServiceAccountAuth: jest.fn(() => Promise.resolve()),
                loadInfo: jest.fn(() => Promise.resolve()),
                title: 'Test Spreadsheet',
                sheetsByIndex: mockWorksheets,
            };

            GoogleSpreadsheet.mockImplementation(() => {
                return mockGoogleSpreadsheetInstance;
            });
        });
        test('tests will throw error without crednetials', () => {
            return expect(
                spreadsheetTranslations.loadTranslations('some-id')
            ).rejects.toEqual(new Error('Must provide credentials'));
        });

        test('tests that it authenticates with google apis', (done) => {
            spreadsheetTranslations.loadTranslations(
                'some-id',
                {
                    email: 'jim@example.com',
                },
                () => {
                    expect(
                        mockGoogleSpreadsheetInstance.useServiceAccountAuth
                    ).toHaveBeenCalledWith({
                        email: 'jim@example.com',
                    });
                    done();
                }
            );
        });

        describe('happy path', () => {
            test.each([
                ['JPARK', 'A_KEY', 'en', 'A key'],
                ['JPARK', 'A_KEY', 'fr', 'Une clé'],
                ['JPARK', 'WELCOME', 'en', 'Welcome... to Jurassic Park.'],
                ['JPARK', 'WELCOME', 'fr', 'Bienvenue ... à Jurassic Park.'],
                ['JPARK', 'THIS_KEY_DOES_NOT_EXIST', 'en', undefined],
                [
                    'JPARK',
                    'KEY_EXISTS_FOR_EN_ONLY',
                    'en',
                    'This key has not been translated to french',
                ],
                ['JAWS', 'A_KEY', 'en', 'A key'],
                ['JAWS', 'A_KEY', 'fr', 'Une clé'],
                ['JAWS', 'WELCOME', 'en', "You're gonna need a bigger boat!"],
                [
                    'JAWS',
                    'WELCOME',
                    'fr',
                    "Tu vas avoir besoin d'un plus gros bateau!",
                ],
                ['JAWS', 'THIS_KEY_DOES_NOT_EXIST', 'en', undefined],
            ])(
                'tests for brand: %s, key: %s, locale: %s value of %s is present',
                (brand, key, locale, expected, done) => {
                    spreadsheetTranslations.loadTranslations(
                        'some-id',
                        { email: 'jim@example.com' },
                        (err, worksheetTranslations) => {
                            expect(
                                worksheetTranslations
                                    .find((sheet) => sheet.getTitle() === brand)
                                    .getTranslationsForLocale(locale)[key]
                            ).toEqual(expected);
                            done();
                        }
                    );
                }
            );
        });
    });

    describe('updateTokens', () => {
        let mockGoogleSpreadsheetInstance;
        let mockWorksheets;
        const mockAddRow = {};

        beforeEach(() => {
            mockAddRow.JPARK = jest.fn(() => Promise.resolve());
            mockAddRow.JAWS = jest.fn(() => Promise.resolve());
            mockWorksheets = [
                {
                    title: 'JPARK',
                    getRows: jest.fn(() =>
                        Promise.resolve([
                            {
                                token: 'A_KEY',
                                en: 'A key',
                                fr: 'Une clé',
                            },
                            {
                                token: 'WELCOME',
                                en: 'Welcome... to Jurassic Park.',
                                fr: 'Bienvenue ... à Jurassic Park.',
                            },
                            {
                                token: 'KEY_EXISTS_FOR_EN_ONLY',
                                en:
                                    'This key has not been translated to french',
                            },
                        ])
                    ),
                    addRow: mockAddRow.JPARK,
                },
                {
                    title: 'JAWS',
                    getRows: jest.fn(() =>
                        Promise.resolve([
                            {
                                token: 'A_KEY',
                                en: 'A key',
                                fr: 'Une clé',
                            },
                            {
                                token: 'WELCOME',
                                en: "You're gonna need a bigger boat!",
                                fr:
                                    "Tu vas avoir besoin d'un plus gros bateau!",
                            },
                        ])
                    ),
                    addRow: mockAddRow.JAWS,
                },
            ];

            mockGoogleSpreadsheetInstance = {
                useServiceAccountAuth: jest.fn(() => Promise.resolve()),
                loadInfo: jest.fn(() => Promise.resolve()),
                title: 'Test Spreadsheet',
                sheetsByIndex: mockWorksheets,
            };

            GoogleSpreadsheet.mockImplementation(() => {
                return mockGoogleSpreadsheetInstance;
            });
        });
        test('tests the requirement of credentials when calling', () => {
            return expect(
                spreadsheetTranslations.updateTokens('some-id')
            ).rejects.toEqual(new Error('Must provide credentials'));
        });

        test('tests that it authenticates with google apis', (done) => {
            spreadsheetTranslations.updateTokens(
                'some-id',
                [],
                {
                    email: 'jim@example.com',
                },
                () => {
                    expect(
                        mockGoogleSpreadsheetInstance.useServiceAccountAuth
                    ).toHaveBeenCalledWith({
                        email: 'jim@example.com',
                    });
                    done();
                }
            );
        });

        describe('happy path', () => {
            test.each([
                [['NEW_TOKEN_1', 'NEW_TOKEN_2'], 'JPARK', 'NEW_TOKEN_1'],
                [['NEW_TOKEN_1', 'NEW_TOKEN_2'], 'JPARK', 'NEW_TOKEN_2'],
                [['NEW_TOKEN_1', 'NEW_TOKEN_2'], 'JAWS', 'NEW_TOKEN_1'],
                [['NEW_TOKEN_1', 'NEW_TOKEN_2'], 'JAWS', 'NEW_TOKEN_1'],
            ])(
                'tests with input of %s, %s sheet has addRow called with %s',
                (tokens, brand, token, done) => {
                    spreadsheetTranslations.updateTokens(
                        'some-id',
                        tokens,
                        { email: 'jim@example.com' },
                        () => {
                            expect(mockAddRow[brand]).toHaveBeenCalledWith({
                                token,
                            });
                            done();
                        }
                    );
                }
            );

            test('tests that addRow will not be called with token that already exists', (done) => {
                spreadsheetTranslations.updateTokens(
                    'some-id',
                    ['SOME_TOKEN_1', 'WELCOME'],
                    { email: 'jim@example.com' },
                    () => {
                        expect(mockAddRow.JPARK).toHaveBeenCalledWith({
                            token: 'SOME_TOKEN_1',
                        });
                        expect(mockAddRow.JPARK).not.toHaveBeenCalledWith({
                            token: 'SOME_TOKEN',
                        });
                        done();
                    }
                );
            });
        });
    });
});
