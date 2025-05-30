const axios = require('axios');
const cheerio = require('cheerio');

const url = 'https://jina.ai';

async function getData() {
  try {
    const { data } = await axios.get(url);
    
    // ✅ Use a real RegExp object, not a string
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/gi;
    
    // ✅ Match against the actual HTML content
    const emails = data.match(emailRegex);

    if (emails) {
      console.log('Email addresses found:');
      console.log(emails);
    } else {
      console.log('No email addresses found.');
    }
  } catch (error) {
    console.error('Error scraping data:', error.message);
  }
}

getData();
