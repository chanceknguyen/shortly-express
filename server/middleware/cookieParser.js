const parseCookies = (req, res, next) => {

  // res.cookie('test', 'cookie');
  let cookieString = req.get('Cookie');
  if (cookieString === undefined) {
    req.cookies = {};

  } else {
    parsedCookies = cookieString.split('; ').reduce((cookies, cookie) => {
      if (cookie) {
        let parts = cookie.split('=');
        cookies[parts[0]] = parts[1];
      }
      return cookies;
    }, {});

    req.cookies = parsedCookies;
  }



  next();
};

module.exports = parseCookies;