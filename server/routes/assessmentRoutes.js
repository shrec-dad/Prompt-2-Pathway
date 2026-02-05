const express = require("express");
const controller = require('../controllers/assessmentController');
const assessmentUpload = require('../middleware/assessmentUpload');
const { authenticate, authorize } = require("../middleware/auth.js");

const router = express.Router();

router.get("/", authenticate, authorize(["client_admin"]), controller.getAllAssessments);
router.get("/:slug", controller.getAssessmentBySlug);

const assessmentFields = [
  { name: 'image', maxCount: 1 },
  { name: 'welcomeMessageAudio', maxCount: 1 },
  { name: 'keepGoingMessageAudio', maxCount: 1 },
  { name: 'congratulationMessageAudio', maxCount: 1 },
  { name: 'contactMessageAudio', maxCount: 1 },
  { name: 'questionAudios', maxCount: 50 },
];

router.post(
  "/",
  assessmentUpload.fields(assessmentFields),
  authenticate,
  authorize(["client_admin"]),
  controller.createAssessment
);

router.put(
  "/:id",
  assessmentUpload.fields(assessmentFields),
  authenticate,
  authorize(["client_admin"]),
  controller.updateAssessment
);

router.delete("/:id", authenticate, authorize(["client_admin"]), controller.deleteAssessment);
router.post("/:id/duplicate", authenticate, authorize(["client_admin"]), controller.duplicateAssessment);
router.post("/:slug/import-questions", authenticate, authorize(["client_admin"]), controller.importQuestions);

module.exports = router;