import express from "express";
import { query as dbQuery} from "../database.js";

const router = express.Router();

const ensureAuthentication = (req, res, next) => {
  if (!req.user) {
    req.flash('error', 'You must login to continue');
    return res.redirect('/authentication/login');
  }
  next();
};

router.get('/:id', ensureAuthentication, async (req, res) => {
  try {
    // Fetch study log details
    const { rows: logRows } = await dbQuery(
      'SELECT * FROM study_logs WHERE id=$1 AND user_id=$2',
      [req.params.id, req.user.id]
    );

    if (!logRows[0]) {
      req.flash('error', 'Study log not found');
      return res.redirect('/dashboard');
    }

    const studyLog = logRows[0];

    // Fetch associated resources
    const { rows: resources } = await dbQuery(
      'SELECT * FROM study_log_resources WHERE study_log_id=$1 ORDER BY created_at DESC',
      [studyLog.id]
    );

    res.render('studyLog', { title: `Study Log #${studyLog.id}`, studyLog, resources });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Could not load study log');
    res.redirect('/dashboard');
  }
});

router.post('/:id/resources', ensureAuthentication, async (req, res) => {
  try {
    let resource = req.body.resources;

    if (!resource) throw new Error("Invalid resource data");

    resource = JSON.parse(resource);

    const { title, snippet, source, url } = resource;

    if (!title || !url) throw new Error("Invalid resource data");

    await dbQuery(
      `INSERT INTO study_log_resources (study_log_id, title, snippet, source, url)
       VALUES ($1, $2, $3, $4, $5)`,
      [req.params.id, title, snippet || null, source, url]
    );

    req.flash('success', 'Resource added successfully');
    res.redirect(`/study-logs/${req.params.id}`);
  } catch (err) {
    console.error(err);
    req.flash('error', 'Could not save resource');
    res.redirect(`/study-logs/${req.params.id}`);
  }
});



// DELETE a study log and its associated resources
router.post('/:id/delete', ensureAuthentication, async (req, res) => {
  const logId = req.params.id;
  const userId = req.user.id;

  try {
    // Delete resources linked to this study log
    await dbQuery(
      `DELETE FROM study_log_resources WHERE study_log_id = $1`,
      [logId]
    );

    // Delete the study log itself
    await dbQuery(
      `DELETE FROM study_logs WHERE id = $1 AND user_id = $2`,
      [logId, userId]
    );

    req.flash('success', 'Study log deleted successfully');
    res.redirect('/dashboard');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Could not delete study log');
    res.redirect('/dashboard');
  }
});


export default router;
