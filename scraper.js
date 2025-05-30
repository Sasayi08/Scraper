const axios = require('axios');
const cheerio = require('cheerio');
const { google } = require('googleapis');
const keys = require('./credentials.json');

const sourceSheetId = '1MU6j7aZLrkIIDT_gzlWaQFm5wMVbCBEJnJJIBZUGyzc'; 
const targetSheetId = '1n6PPfroaJlvs-SG7HPlFztHiKJgBQ6UTaPebDNDlQPQ';

async function getGoogleClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: keys,
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  });
  return await auth.getClient();
}

async function getSiteURLs(auth) {
  const sheets = google.sheets({ version: 'v4', auth });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sourceSheetId,
    range: 'Sheet1!D2:D',
  });

  return res.data.values?.flat().filter(Boolean) || [];
}

function extractEmails(text) {
  const regex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/gi;
  return Array.from(new Set(text.match(regex) || []));
}

async function scrapeEmailsFromSites(urls) {
  const results = [];

  for (const url of urls) {
    try {
      const { data } = await axios.get(`http://${url}`);
      const $ = cheerio.load(data);
      const text = $('body').text();
      const emails = extractEmails(data);

      if (emails.length > 0) {
        console.log(`📧 Found ${emails.length} email(s) for ${url}:`);
        emails.forEach(email => {
          console.log(`   - ${email}`);
          results.push([url, email]);
        });
      } else {
        console.log(`No emails found for ${url}`);
      }

    } catch (err) {
      console.warn(`Failed to scrape ${url}: ${err.message}`);
    }
  }

  return results;
}


async function writeEmailsToSheet(auth, emailData) {
  const sheets = google.sheets({ version: 'v4', auth });

  await sheets.spreadsheets.values.update({
    spreadsheetId: targetSheetId,
    range: 'Sheet1!A1',
    valueInputOption: 'RAW',
    resource: {
      values: [['Website', 'Email'], ...emailData],
    },
  });

  console.log(`Stored ${emailData.length} email(s)`);
}

(async () => {
  const auth = await getGoogleClient();
  const urls = await getSiteURLs(auth);
  console.log('Scraping emails from:', urls);

  const emailData = await scrapeEmailsFromSites(urls);
  await writeEmailsToSheet(auth, emailData);
})();
