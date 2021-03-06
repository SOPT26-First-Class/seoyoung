var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', {
    title: 'Express'
  });
});

// api폴더 index로 접근
router.use('/api', require('./api'));

module.exports = router;