const r = require('../rethinkdb');

module.exports = class Middleware {
  /**
   * A router which checks if the user is logged in or not.
   * If the user is not logged in, respond with JSON.
   * @param {*} req Request
   * @param {*} res Response
   * @param {*} next Next
   */
  static isLoggedInButJSON(req, res, next) {
    if (req.user) {
      next();
    } else {
      res.status(401).json({
        err: true,
        message: 'errors.permissions.login'
      });
    }
  }

  static isLoggedIn(req, res, next) {
    Middleware.isLoggedInButJSON(req, res, next);
  }

  static isAdmin(req, res, next) {
    if (req.user && req.user.admin) {
      next();
    } else {
      res.json({
        ok: false,
        message: 'errors.permissions.denied',
      });
    }
  }

  static isOwnerOfBot(req, res, next) {
    if (req.user && req.user.admin) {
      next();
    } else if (!req.user) {
      res.json({
        ok: false,
        message: 'errors.permissions.login',
      });
    } else {
      r.table('apps')
        .get(req.params.id)
        .then((bot) => {
          if (!bot) {
            next('router');
          } else if (bot.state === 'banned') {
            res.status(403).render('error', {
              message: 'errors.permissions.banned',
            });
          } else if (bot.authors.includes(req.user.id)) {
            next();
          } else {
            res.json({
              ok: false,
              message: 'errors.permissions.denied',
            });
          }
        });
    }
  }

  static botExists(req, res, next) {
    r.table('apps')
      .get(req.params.id)
      .then((bot) => {
        if (!bot) {
          next('router');
        } else if (bot.state === 'approved') {
          next();
        } else if (!req.user) {
          next('router');
        } else if (bot.authors.includes(req.user.id)) {
          next();
        } else if (req.user.admin) {
          next();
        } else {
          next('router');
        }
      });
  }

  static reviewDoesntExist(req, res, next) {
    r.table('reviews')
      .filter({
        bot: req.params.id,
        author: req.user.id
      })
      .count()
      .then((exists) => {
        if (exists) {
          res.status(400).json({
            err: true,
            message: 'A review already exists!'
          });
        } else {
          next();
        }
      });
  }

  static isOwnerOfReview(req, res, next) {
    if (req.user.admin) {
      next();
    } else if (!req.user) {
      res.json({
        ok: false,
        message: 'errors.permissions.login',
      });
    } else {
      r.table('reviews')
        .get(req.params.review)
        .then((review) => {
          if (!review) {
            next('router');
          } else if (review.author === req.user.id) {
            next();
          } else {
            res.json({
              ok: false,
              message: 'errors.permissions.denied',
            });
          }
        });
    }
  }

  static getCategories(req, res, next) {
    r.table('categories')
      .then((categories) => {
        req.categories = categories;
        next();
      });
  }
};
