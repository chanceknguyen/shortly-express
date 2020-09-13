const express = require('express');
const path = require('path');
const utils = require('./lib/hashUtils');
const partials = require('express-partials');
const bodyParser = require('body-parser');
const Auth = require('./middleware/auth');
const models = require('./models');
const db = require('./db');


const app = express();

app.set('views', `${__dirname}/views`);
app.set('view engine', 'ejs');
app.use(partials());
app.use(bodyParser.json());
app.use((bodyParser.urlencoded({ extended: true })));
app.use(express.static(path.join(__dirname, '../public')));
app.use(require('./middleware/cookieParser'));
app.use(Auth.createSession);



app.get('/',
  (req, res) => {
    res.render('index');
  });

app.get('/create',
  (req, res) => {
    res.render('index');
  });

app.get('/links',
  (req, res, next) => {
    models.Links.getAll()
      .then(links => {
        res.status(200).send(links);
      })
      .error(error => {
        res.status(500).send(error);
      });
  });

app.post('/links',
  (req, res, next) => {
    var url = req.body.url;
    if (!models.Links.isValidUrl(url)) {
      // send back a 404 if link is not valid
      return res.sendStatus(404);
    }

    return models.Links.get({ url })
      .then(link => {
        if (link) {
          throw link;
        }
        return models.Links.getUrlTitle(url);
      })
      .then(title => {
        return models.Links.create({
          url: url,
          title: title,
          baseUrl: req.headers.origin
        });
      })
      .then(results => {
        return models.Links.get({ id: results.insertId });
      })
      .then(link => {
        throw link;
      })
      .error(error => {
        res.status(500).send(error);
      })
      .catch(link => {
        res.status(200).send(link);
      });
  });

/************************************************************/
// Write your authentication routes here
/************************************************************/
app.post('/signup', (req, res, next) => {
  console.log(res);
  db.query('SELECT * FROM users where username = ?', req.body.username, (err, result) => {
    if (result.length === 0) {
      models.Users.create({username: req.body.username, password: req.body.username});
      // var hash = res.cookies.shortlyid;
      // db.query('select id from users where username = ?', req.body.username, function(error, results) {
      //   var userid = results;
      // });
      // db.query('UPDATE into sessions set userId = ? WHERE hash = ', [userid, hash], function(error, results) {
      //   console.log(results);
      // });
      res.redirect('/');
    } else {
      res.redirect('/signup');
    }
  });
});

app.post('/login', (req, res, next) => {

  var username = req.body.username;
  db.query('SELECT * FROM users where username = ?', username, (err, result) => {
    var user = result[0];
    if (user === undefined) {
      console.log('No username found!');
      res.redirect('/login');
    } else {
      var correctLogin = models.Users.compare(req.body.password, user.password, user.salt);
      if (correctLogin) {
        console.log('Logged In!');
        res.redirect('/');
      } else {
        console.log('Bad password!');
        res.redirect('/login');
      }
    }
  });
});

/************************************************************/
// Handle the code parameter route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/:code', (req, res, next) => {

  return models.Links.get({ code: req.params.code })
    .tap(link => {

      if (!link) {
        throw new Error('Link does not exist');
      }
      return models.Clicks.create({ linkId: link.id });
    })
    .tap(link => {
      return models.Links.update(link, { visits: link.visits + 1 });
    })
    .then(({ url }) => {
      res.redirect(url);
    })
    .error(error => {
      res.status(500).send(error);
    })
    .catch(() => {
      res.redirect('/');
    });
  next();
});

module.exports = app;
