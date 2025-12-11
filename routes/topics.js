import express from 'express';
import slugify from 'slugify';
import { query as dbQuery } from '../database.js';

const router = express.Router();


const ensureAuthentication = (req, res, next) => {
  //req.user is set by Passport when a user is logged in. If it’s undefined → user is not authenticated
  if (!req.user) {
    req.flash('error', 'You must login to continue');
    return res.redirect('/authentication/login'); //goto the login page
  }

  next();
};

router.get('/new', ensureAuthentication, (req, res) => {
  res.render("topics/new");

});



//when logged in user enters enew topic
router.post('/', ensureAuthentication, async (req, res) => {
  try {
    const { title, description } = req.body;

    //   A slug is a URL-friendly version of a string (usually a title). and they are SEO friendly
    const slug = slugify(title || Date.now().toString(), { lower: true, strict: true });
    await dbQuery('INSERT INTO topics (user_id, title, slug, description) VALUES ($1, $2, $3, $4)',
      [req.user.id, title, slug, description]);
    req.flash('Topic created successfully')
    res.redirect('/dashboard');
  }
  catch (error) {
    console.log(err);
    req.flash('error', 'could not create topic');
    res.redirect('/topics/new');
  }
});



//////get or display topics with their study logs
router.get('/:id', ensureAuthentication, async (req, res) => {
  try {
    const { rows: topicRows } = await dbQuery(
      'SELECT * FROM topics WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );

    if (!topicRows[0]) {
      req.flash('error', 'Topic not found');
      return res.redirect('/dashboard');
    }

    const topic = topicRows[0];

    const { rows: resources } = await dbQuery(
      'SELECT * FROM resources WHERE topic_id = $1 ORDER BY created_at DESC',
      [topic.id]
    );

    const { rows: logs } = await dbQuery(
      'SELECT * FROM study_logs WHERE topic_id = $1 ORDER BY created_at DESC',
      [topic.id]
    );

    // Make all strings safe for EJS/JS
    const safeTopic = {
      ...topic,
      title: (topic.title || '').replace(/\r?\n|\r/g, ' '),
      description: (topic.description || '').replace(/\r?\n|\r/g, ' ')
    };

    const safeResources = resources.map(r => ({
      ...r,
      title: (r.title || '').replace(/\r?\n|\r/g, ' '),
      snippet: (r.snippet || '').replace(/\r?\n|\r/g, ' ')
    }));

    const safeLogs = logs.map(l => ({
      ...l,
      notes: (l.notes || '').replace(/\r?\n|\r/g, ' ')
    }));

    res.render('topic', {
      title: safeTopic.title,
      topic: safeTopic,
      resources: safeResources,
      logs: safeLogs
    });

  } catch (err) {
    console.error(err);
    req.flash('error', "Couldn't load topic");
    res.redirect('/dashboard');
  }
});




router.post('/:id/logs', ensureAuthentication, async (req, res) => {
  try {
    const { minutes, notes, resources } = req.body;
    const duration = parseInt(minutes || 0, 10);
    const resourcesArray = resources ? JSON.parse(resources) : [];

    // Insert study log
    const { rows: logRows } = await dbQuery(
      `INSERT INTO study_logs (user_id, topic_id, duration_in_minutes, notes)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [req.user.id, req.params.id, duration, notes || null]
    );

    const logId = logRows[0].id;

    // Insert selected resources under the same topic (optional: track in resources table)
    for (const r of resourcesArray) {
      await dbQuery(
        `INSERT INTO resources (topic_id, title, snippet, url, source, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [req.params.id, r.title, r.snippet, r.url, r.source]
      );
    }

    req.flash('success', 'Study log and selected resources saved successfully');
    res.redirect(`/topics/${req.params.id}`);
  } catch (err) {
    console.error(err);
    req.flash('error', 'Could not save study log');
    res.redirect(`/topics/${req.params.id}`);
  }
});

// POST multiple resources to a single study log
router.post('/:id/logs/saveMultiple', ensureAuthentication, async (req, res) => {
  const { minutes, notes, resources } = req.body;
  const userId = req.user.id;
  const topicId = req.params.id;

  try {
    const parsedResources = JSON.parse(resources);

    // 1️ Create study log
    const result = await dbQuery(
      `INSERT INTO study_logs (user_id, topic_id, duration_in_minutes, notes)
       VALUES ($1,$2,$3,$4) RETURNING id`,
      [userId, topicId, minutes || 0, notes || null]
    );
    const studyLogId = result.rows[0].id;

    // Insert all selected resources
    for (let r of parsedResources) {
      await dbQuery(
        `INSERT INTO study_log_resources (study_log_id, title, snippet, source, url)
         VALUES ($1,$2,$3,$4,$5)`,
        [studyLogId, r.title, r.snippet || null, r.source, r.url]
      );
    }

    req.flash('success', 'Study log and resources saved!');
    res.redirect(`/topics/${topicId}`);
  } catch (err) {
    console.error(err);
    req.flash('error', 'Could not save study log.');
    res.redirect('back');
  }
});



// DELETE a topic and all its related logs and resources
router.post('/:id/delete', ensureAuthentication, async (req, res) => {
  const topicId = req.params.id;
  const userId = req.user.id;

  try {
    //  Delete study_log_resources related to logs of this topic
    await dbQuery(
      `DELETE FROM study_log_resources
       WHERE study_log_id IN (
         SELECT id FROM study_logs WHERE topic_id = $1 AND user_id = $2
       )`,
      [topicId, userId]
    );

    // Delete study_logs of this topic
    await dbQuery(
      `DELETE FROM study_logs WHERE topic_id = $1 AND user_id = $2`,
      [topicId, userId]
    );

    // Delete resources of this topic
    await dbQuery(
      `DELETE FROM resources WHERE topic_id = $1`,
      [topicId]
    );

    //  Delete the topic itself
    await dbQuery(
      `DELETE FROM topics WHERE id = $1 AND user_id = $2`,
      [topicId, userId]
    );

    req.flash('success', 'Topic and all related logs/resources deleted successfully');
    res.redirect('/dashboard');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Could not delete topic');
    res.redirect('/dashboard');
  }
});


export default router;
