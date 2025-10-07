const path = require('node:path');
const { I18n } = require('i18n');

const i18n = new I18n({
    locales: ['en', 'fr',],
    directory: path.join(__dirname, '..', '..', 'locales'),
    defaultLocale: 'en',
    objectNotation: true
});

module.exports = i18n;