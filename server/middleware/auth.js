const models = require('../models');
const Promise = require('bluebird');

module.exports.createSession = (req, res, next) => {

  Promise.resolve(req.cookies.shortlyid)
    .then((hash) => {
      if (!hash) {
        throw hash;
      }
      return models.Sessions.get(hash);
    })
    .then((session) => {
      if (!session) {
        throw session;
      }
      return session;
    })
    .catch(() => {
      return models.Sessions.create()
        .then(results => {
          return models.Sessions.get({id: results.insertId});
        })
        .then(session => {
          res.cookie('shortlyid', session.hash);
          return session;
        });
    })
    .then((session) => {
      req.session = session;
      next();
    });

  // check hash
  // if exists
  // return models.Sessions.get(hash) which is an object
  // else, create a session
};

/************************************************************/
// Add additional authentication middleware functions below
/************************************************************/

