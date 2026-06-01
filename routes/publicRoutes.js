const express = require('express');
const router = express.Router();
const Achievement = require('../models/Achievement');

router.get('/achievements', async (req, res) => {

    const achievements =
      await Achievement.find()
      .sort({ createdAt: -1 });
    res.json(achievements);
  }
);

module.exports = router;