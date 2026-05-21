const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const Applicant = require('../models/Applicant');
const applicantAuth = require('../middleware/applicantAuth');

const verifyToken = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');

const PDFDocument = require('pdfkit');

const router = express.Router();


// =====================================
// APPLY FOR ADMISSION
// =====================================
router.post('/apply', async (req, res) => {

  try {

    const {
      surname,
      firstName,
      middleName,
      gender,
      dateOfBirth,
      applyingForClass,
      previousSchool,
      parentName,
      parentPhone,
      parentEmail,
      address,
      email,
      password
    } = req.body;

    // check existing applicant
    const existingApplicant = await Applicant.findOne({ email });

    if (existingApplicant) {
      return res.status(400).json({
        message: 'Applicant already exists'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const applicant = new Applicant({
      surname,
      firstName,
      middleName,
      gender,
      dateOfBirth,
      applyingForClass,
      previousSchool,
      parentName,
      parentPhone,
      parentEmail,
      address,
      email,
      password: hashedPassword
    });

    await applicant.save();

    res.status(201).json({
      message: 'Application submitted successfully'
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: 'Server Error'
    });

  }

});


// =====================================
// APPLICANT LOGIN
// =====================================
router.post('/login', async (req, res) => {

  try {

    const { email, password } = req.body;

    const applicant = await Applicant.findOne({ email });

    if (!applicant) {
      return res.status(401).json({
        message: 'Invalid credentials'
      });
    }

    const isMatch = await bcrypt.compare(
      password,
      applicant.password
    );

    if (!isMatch) {
      return res.status(401).json({
        message: 'Invalid credentials'
      });
    }

    const token = jwt.sign(
      {
        userId: applicant._id,
        role: 'applicant'
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '7d'
      }
    );

    res.json({
      token,
      applicant: {
        id: applicant._id,
        surname: applicant.surname,
        firstName: applicant.firstName,
        email: applicant.email,
        admissionStatus: applicant.admissionStatus,
        entranceScore: applicant.entranceScore
      }
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: 'Server Error'
    });

  }

});

// =====================================
// GET APPLICANT PROFILE
// =====================================

router.get('/profile', applicantAuth, async (req, res) => {
    try {
      const applicant = await Applicant.findById(
        req.applicant.userId
      ).select('-password')

      if (!applicant) {
        return res.status(404).json({
          message: 'Applicant not found'
        })
      }

      res.json(applicant)

    } catch (error) {

      console.error(error)

      res.status(500).json({
        message: 'Server Error'
      })
    }
  }
);

// =====================================
// GET ADMISSION STATUS
// =====================================

router.get('/status', applicantAuth, async (req, res) => {
    try {
      const applicant = await Applicant.findById(
        req.applicant.userId
      )

      if (!applicant) {
        return res.status(404).json({
          message: 'Applicant not found'
        })
      }

      res.json({
        admissionStatus:
          applicant.admissionStatus,

        entranceScore:
          applicant.entranceScore,

        admissionNumber:
          applicant.admissionNumber,

        remarks:
          applicant.remarks
      })
    } catch (error) {
      console.error(error)
      res.status(500).json({
        message: 'Server Error'
      })
    }
  }
);

// =====================================
// DOWNLOAD ADMISSION LETTER
// =====================================

router.get('/admission-letter', applicantAuth, async (req, res) => {
    try {
      const applicant = await Applicant.findById(
        req.applicant.userId
      );
      if (!applicant) {
        return res.status(404).json({
          message: 'Applicant not found'
        });
      }
      if (applicant.admissionStatus !== 'accepted') {
        return res.status(400).json({
          message: 'Admission not yet granted'
        });
      }
      const doc = new PDFDocument({
        margin: 50
      });
      res.setHeader(
        'Content-Type',
        'application/pdf'
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=AdmissionLetter.pdf`
      );
      doc.pipe(res);
      // SCHOOL NAME
      doc
        .fontSize(24)
        .text('PERFECT FOUNDATION SCHOOL', {
          align: 'center'
        });
      doc.moveDown();
      doc
        .fontSize(20)
        .text('ADMISSION LETTER', {
          align: 'center'
        });
      doc.moveDown(2);
      doc
        .fontSize(14)
        .text(
          `Dear ${applicant.surname} ${applicant.firstName},`
        );
      doc.moveDown();
      doc.text(
        `We are pleased to inform you that you have been offered provisional admission into ${applicant.applyingForClass}.`
      );
      doc.moveDown();
      doc.text(
        `Entrance Score: ${applicant.entranceScore || '-'}`
      );
      doc.moveDown();
      doc.text(
        `Remarks: ${applicant.remarks || 'Congratulations'}`
      );
      doc.moveDown(2);
      doc.text(
        'Please proceed to the school for documentation and clearance.'
      );
      doc.moveDown(3);
      doc.text(
        'Signed:',
        {
          align: 'right'
        }
      );
      doc.text(
        'School Management',
        {
          align: 'right'
        }
      );
      doc.end();
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: 'Failed to generate letter'
      });
    }
  }
);

module.exports = router;