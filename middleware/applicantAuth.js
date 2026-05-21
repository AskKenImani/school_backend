const jwt = require('jsonwebtoken')

module.exports = (req, res, next) => {

  try {

    const authHeader = req.headers.authorization

    if (!authHeader) {
      return res.status(401).json({
        message: 'No token provided'
      })
    }

    const token = authHeader.split(' ')[1]

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    )

    if (decoded.role !== 'applicant') {
      return res.status(403).json({
        message: 'Unauthorized'
      })
    }

    req.applicant = decoded

    next()

  } catch (error) {

    console.error(error)

    res.status(401).json({
      message: 'Invalid token'
    })

  }
}