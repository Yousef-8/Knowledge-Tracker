import express from 'express';
import axios from 'axios';
import { query as dbQuery } from '../database.js';

const router = express.Router();

const saveResource = async (topicId, source, title, url, snippet, extra = null) => {
  await dbQuery('INSERT INTO resources (topic_id, source, title, url, snippet, extra) VALUES ($1, $2, $3, $4, $5, $6)',
    [topicId, source, title, url, snippet, extra ? JSON.stringify(extra) : null]);//If extra exists / is not null → convert it to JSON. Otherwise → store NULL in the database.
};



router.get('/youtube', async (req, res) => {

  const q = req.query.q;
  const topicId = req.query.topic_id || null;
  const pageToken = req.query.pageToken || null; // 

  if (!q) {
    return res.status(400).json({ error: 'q is required' });
  }
  try {
    const youtubeAPIKey = process.env.YOUTUBE_API_KEY;
    if (!youtubeAPIKey) {
      return res.status(500).json({ error: 'YOUTUBE_API_KEY not configured' });
    }

    /*
    The URL is not a normal website, it’s an API endpoint.It requires parameters: key, q, part, etc.
    Backend uses axios to call it properly.It will not work if you type the base URL alone in the browser.
        
     */
    const url = 'https://www.googleapis.com/youtube/v3/search';
    /*
    Axios automatically builds the full URL:
    
    https://www.googleapis.com/youtube/v3/search
        ?key=YOUR_API_KEY
        &q=SEARCH_TERM
        &part=snippet
        &maxResults=6
        &type=video
*/

    const youtubeResults = await axios.get(url, {
      params: {
        key: youtubeAPIKey,
        q,
        part: 'snippet',
        maxResults: 6,
        type: 'video',
        pageToken 
      }
    });

  

    const items = youtubeResults.data.items.map((video) => ({
      source: 'Youtube',
      title: video.snippet.title,
      url: `https://www.youtube.com/watch?v=${video.id.videoId}`, //That line creates a valid YouTube video URL by inserting the video's ID.
      snippet: video.snippet.description,
      extra: { 
        channelTitle: video.snippet.channelTitle, 
        publishedAt: video.snippet.publishedAt,
        thumbnail: video.snippet.thumbnails?.default?.url
      
      }
    }));

  
    if (topicId) {
      for (const video of items) {
        await saveResource(topicId, video.source, video.title, video.url, video.snippet, video.extra);
      }
    }


    return res.json({ results: items, nextPageToken: youtubeResults.data.nextPageToken || null }); //This line returns the search results (YouTube videos) to whoever called your API, in a clean JSON format.

  }
  catch (err) {

    console.error(err?.response?.data || err.message);
    return res.status(500).json({ error: 'YouTube fetch failed' });


  }

});


router.get('/duck', async (req, res) => {
  const q = req.query.q;
  const topicId = req.query.topic_id || null;
  const page = parseInt(req.query.page || '0'); // new: page number for offset
  if(!q) return res.status(400).json({error: 'q is required'});

  try {
    const url = 'https://api.duckduckgo.com/';
    const ddgResp = await axios.get(url, { 
      params: { 
        q,
        format: 'json',
        no_html: 1, 
        skip_disambig: 1 
      },
      headers: { 'User-Agent': 'KnowledgeTrackerApp/1.0 (+https:http://localhost:3000/)' }
    });

    let results = [];

    // Add instant abstract first (only for first page)
    if(page === 0 && ddgResp.data.Abstract){
      results.push({
        source: 'DuckDuckGo',
        title: ddgResp.data.Heading || q,
        url: ddgResp.data.AbstractURL || `https://duckduckgo.com/?q=${encodeURIComponent(q)}`,
        snippet: ddgResp.data.Abstract
      });
    }

    // Flatten RelatedTopics
    let topics = [];
    if(Array.isArray(ddgResp.data.RelatedTopics)){
      ddgResp.data.RelatedTopics.forEach(t => {
        if(t.Text && t.FirstURL) topics.push({title: t.Text, url: t.FirstURL, snippet: ''});
        else if(t.Topics){
          t.Topics.forEach(sub => {
            if(sub.Text && sub.FirstURL) topics.push({title: sub.Text, url: sub.FirstURL, snippet: ''});
          });
        }
      });
    }

    // Use page & limit to simulate pagination
    const pageSize = 5;
    const start = page * pageSize;
    const pageItems = topics.slice(start, start + pageSize);

    pageItems.forEach(r => results.push({
      source: 'DuckDuckGo',
      title: r.title,
      url: r.url,
      snippet: r.snippet
    }));

    if(topicId){
      for(const r of results) await saveResource(topicId, r.source, r.title, r.url, r.snippet, null);
    }

    res.json({ results });
  }
  catch(err){
    console.log(err?.response?.data || err.message);
    res.status(500).json({ error: 'duck fetch failed' });
  }
});


router.get('/wiki', async (req, res) => {
  const q = req.query.q;
  const topicId = req.query.topic_id || null;
  const page = parseInt(req.query.page || '0'); // page for offset
  if(!q) return res.status(400).json({error: 'q required'});

  try {
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(q)}`;
    const wikiResp = await axios.get(url, { headers: { 'User-Agent': 'KnowledgeTracker/1.0 w68922317@gmail.com' } });

    // For Wikipedia, simulate pagination by splitting the extract into chunks
    const fullText = wikiResp.data.extract || '';
    const sentences = fullText.split(/(?<=[.!?])\s+/); // split by sentence
    const pageSize = 3; // sentences per “page”
    const start = page * pageSize;
    const pageSentences = sentences.slice(start, start + pageSize).join(' ');

    const item = {
      source: 'wikipedia',
      title: wikiResp.data.title,
      url: wikiResp.data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(q)}`,
      snippet: pageSentences || 'No more content'
    };

    if(topicId) await saveResource(topicId, item.source, item.title, item.url, item.snippet, null);

    res.json({ results: [item] });
  }
  catch(err){
    console.error(err?.response?.data || err.message);
    res.status(500).json({ error: 'wiki fetch failed' });
  }
});


export default router;
