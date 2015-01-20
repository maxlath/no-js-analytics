/**
 * Module dependencies.
 */

var fs = require('fs')
  , _ = require('underscore.string')
  , useragent = require('express-useragent');

/**
 * Initialize
 */

var db = {}
  , pageviews = 1;

db.Browser = {}
  , db.Platform = {}
  , db.Type = {}
  , db.Path = {}
  , db.Language = {};

/**
 * Middleware
 */

var middleware = function (req, res, next) {

  if (_.include(req.url, ".")) {
    next();
  }

  else {

    if (req.headers['user-agent'] !== undefined) {

      var ua = useragent.parse(req.headers['user-agent']);

      if (req.headers['accept-language'] === undefined) {
        req.headers['accept-language'] = 'unknown';
      }

      function checkType () {
        if (ua.isMobile === true) {
          return 'mobile';
        }
        else {
          return 'desktop';
        }
      }

      records(ua.Browser, ua.Platform, checkType(), req._parsedUrl['path'], req.headers['accept-language'].split(',')[0]);

    }

    next();

  }

};

/**
 * Records
 */

function records (browser, platform, type, path, language) {

  db.Browser[browser] = {
    'views': counter(browser, 'Browser')
  };

  db.Platform[platform] = {
    'views': counter(platform, 'Platform')
  };

  db.Type[type] = {
    'views': counter(type, 'Type')
  };

  db.Path[path] = {
    'views': counter(path, 'Path')
  };

  db.overall = {
    'views': pageviews++
  };

  db.Language[language] = {
    'views': counter(language, 'Language')
  };

}

/**
 * Counter
 */

function counter (index, root) {

  if (db[root][index] === undefined) {
    return 1;
  }
  else {
    db[root][index].views++;
    return db[root][index].views++;
  }

}

/**
 * Save and export db object
 */

var save = function () {
  var date = new Date().toJSON()
  var name = date + '.json'
  var path = 'logs/analytics/' + name
  fs.writeFile(path, JSON.stringify(db), function (err) {
    if (err) throw err;
    console.log('Analytics saved to file ' + path);
  });
};

var stats = function () {
  return db;
};

/**
 * Automatically save db object once in every two hours
 */

setInterval(function() {
  save();
}, 7200000);

/**
 * Flush all data once in a day
 */

setInterval(function() {

  delete db.Browser;
  delete db.Platform;
  delete db.Type;
  delete db.Path;
  delete db.Language;

  db.Browser = {}
    , db.Platform = {}
    , db.Type = {}
    , db.Path = {}
    , db.Language = {};

  console.log('Object database flushed.');

}, 86400000);

module.exports = middleware;
module.exports.save = save;
module.exports.stats = stats;
