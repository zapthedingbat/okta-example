const express = require('express');
const cookieParser = require('cookie-parser')
const fetch = require('node-fetch');
const { randomBytes } = require('crypto');

const PORT = 3000;
const AUTHORIZE_URL = 'https://condenast-hub.oktapreview.com/oauth2/default/v1/authorize';
const TOKEN_URL = 'https://condenast-hub.oktapreview.com/oauth2/default/v1/token';
const AUTH_COOKIE_STATE_NAME = 'auth_state';

const app = express();
app.use(cookieParser());

function renderHtmlPage (title, body) {
  return `<html><head><title>${title}</title></head><body><h1>OKTA Example</h1>${body}</body></html>`;
}

function getRedirectUri(req) {
  return `${req.protocol}://${req.headers.host}/callback`;
}

function getLoginUrl(req, state) {
  const redirectUri = encodeURIComponent(getRedirectUri(req));
  return `${AUTHORIZE_URL}?client_id=${process.env.OKTA_CLIENT_ID}&response_type=code&scope=openid&redirect_uri=${redirectUri}&state=${encodeURIComponent(state)}`;
}

function getBasicAuthHeader() {
  return new Buffer.from(`${process.env.OKTA_CLIENT_ID}:${process.env.OKTA_CLIENT_SECRET}`).toString('base64');
}

function home(req, res) {
  const htmlPage = renderHtmlPage('OKTA Example | Home', `
  <ul>
  <li>Your application directs the browser to the Okta Sign-In page, where the user authenticates.</li>
  </ul>
  <a href="/login">Sign In</a>
  `);
  res.send(htmlPage);
}

function login(req, res) {
  randomBytes(16, (_, buffer) => {
    const state = buffer.toString('hex');
    const loginUrl = getLoginUrl(req, state);
    res.cookie(AUTH_COOKIE_STATE_NAME, state, { httpOnly: true });
    res.redirect(loginUrl);
  });
}

function callback(req, res) {
  const code = req.query.code;

  // Ensure the state matches the cookie to protect against cross-site request forgery
  if (req.query.state !== req.cookies[AUTH_COOKIE_STATE_NAME]) {
    res.send(renderHtmlPage('OKTA Example | Error', `State authentication did not match`));
    return;
  }
  
  // Exchanging the Code for Tokens
  const basicAuthHeader = getBasicAuthHeader();
  const redirectUri = encodeURIComponent(getRedirectUri(req));
  fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      "authorization": `Basic ${basicAuthHeader}`,
      "accept": "application/json",
      "content-type": "application/x-www-form-urlencoded"
    },
    body: `grant_type=authorization_code&redirect_uri=${redirectUri}&code=${code}`
  })
  .then(r => r.json())
  .then(r => {
    const htmlPage = renderHtmlPage('OKTA Example | Callback', `
    <ul>
    <li>The browser receives an authorization code (<code>${code}</code>) from your Okta authorization server.</li>
    <li>The authorization code is passed to your application.</li>
    <li>Your application sends this code to Okta, and Okta returns access and ID tokens, and optionally a refresh token.</li>
    </ul>
    <pre>${JSON.stringify(r, null, 2)}</pre>
    <ul>
      <li>Your application can now use these tokens (<code>access_token</code>) to call the resource server (for example an API) on behalf of the user.</li>
    </ul>
    `);
    res.send(htmlPage);
  })
  .catch(err => {
    const htmlPage = renderHtmlPage('OKTA Example | Error', `<pre>${err}</pre>`);
    res.send(htmlPage);
  })
}

app.get('/', home);
app.get('/login', login);
app.get('/callback', callback);

app.listen(PORT, () => console.log(`Server listening on port ${PORT}!`))
