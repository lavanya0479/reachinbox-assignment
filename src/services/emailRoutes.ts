import { Router, Request, Response } from 'express';
import { esClient } from '../config/elasticClient';

const router = Router();
const EMAIL_INDEX = 'emails';

/**
 * GET /api/emails/search?q=query&from=email&subject=text
 * General search endpoint
 */
router.get('/search', async (req: Request, res: Response) => {
  try {
    const {
      q,           // General search query
      from,        // Filter by sender email
      subject,     // Filter by subject
      account,     // Filter by account
      startDate,   // Filter from date (ISO format)
      endDate,     // Filter to date (ISO format)
      limit = 10,
      offset = 0,
    } = req.query;

    const must: any[] = [];
    const filter: any[] = [];

    // General search across multiple fields
    if (q) {
      must.push({
        multi_match: {
          query: q,
          fields: ['subject^3', 'body', 'from^2', 'to'],
          type: 'best_fields',
          fuzziness: 'AUTO',
        },
      });
    }

    // Filter by sender
    if (from) {
      filter.push({
        match_phrase: { from: from },
      });
    }

    // Filter by subject
    if (subject) {
      must.push({
        match: { subject: subject },
      });
    }

    // Filter by account
    if (account) {
      filter.push({
        term: { 'account.keyword': account },
      });
    }

    // Date range filter
    if (startDate || endDate) {
      const dateRange: any = {};
      if (startDate) dateRange.gte = startDate;
      if (endDate) dateRange.lte = endDate;
      
      filter.push({
        range: { date: dateRange },
      });
    }

    const searchQuery: any = {
      bool: {
        must: must.length > 0 ? must : [{ match_all: {} }],
        filter: filter.length > 0 ? filter : undefined,
      },
    };

    const result = await esClient.search({
      index: EMAIL_INDEX,
      query: searchQuery,
      from: Number(offset),
      size: Number(limit),
      sort: [{ date: 'desc' }],
      highlight: {
        fields: {
          subject: {},
          body: { fragment_size: 150 },
        },
        pre_tags: ['<mark>'],
        post_tags: ['</mark>'],
      },
    });

    res.json({
      total: result.hits.total,
      results: result.hits.hits.map((hit: any) => ({
        id: hit._id,
        score: hit._score,
        ...hit._source,
        highlights: hit.highlight,
      })),
      query: { q, from, subject, account, startDate, endDate, limit, offset },
    });
  } catch (error: any) {
    console.error('❌ Search error:', error);
    res.status(500).json({ 
      error: 'Search failed', 
      details: error.message 
    });
  }
});

/**
 * GET /api/emails/by-sender/:email
 * Get all emails from a specific sender
 */
router.get('/by-sender/:email', async (req: Request, res: Response) => {
  try {
    const { email } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    const result = await esClient.search({
      index: EMAIL_INDEX,
      query: {
        match_phrase: { from: email },
      },
      from: Number(offset),
      size: Number(limit),
      sort: [{ date: 'desc' }],
    });

    res.json({
      sender: email,
      total: result.hits.total,
      emails: result.hits.hits.map((hit: any) => ({
        id: hit._id,
        ...hit._source,
      })),
    });
  } catch (error: any) {
    console.error('❌ Search by sender error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch emails', 
      details: error.message 
    });
  }
});

/**
 * GET /api/emails/by-account/:account
 * Get all emails for a specific account
 */
router.get('/by-account/:account', async (req: Request, res: Response) => {
  try {
    const { account } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const result = await esClient.search({
      index: EMAIL_INDEX,
      query: {
        term: { 'account.keyword': account },
      },
      from: Number(offset),
      size: Number(limit),
      sort: [{ date: 'desc' }],
    });

    res.json({
      account: account,
      total: result.hits.total,
      emails: result.hits.hits.map((hit: any) => ({
        id: hit._id,
        ...hit._source,
      })),
    });
  } catch (error: any) {
    console.error('❌ Search by account error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch emails', 
      details: error.message 
    });
  }
});

/**
 * GET /api/emails/recent?days=7
 * Get recent emails from the last N days
 */
/**
 * GET /api/emails/recent?days=7&page=1&limit=10&account=email@gmail.com
 * Get recent emails with pagination
 */
router.get('/recent', async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 7;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const account = req.query.account as string | undefined;

    const from = (page - 1) * limit;

    const dateRange: any = {
      gte: `now-${days}d/d`,
      lte: "now",
    };

    const query: any = account
      ? {
          bool: {
            must: [
              { range: { date: dateRange } },
              { term: { 'account.keyword': account } },
            ],
          },
        }
      : { range: { date: dateRange } };

    const result = await esClient.search({
      index: 'emails',
      from,
      size: limit,
      query,
      sort: [{ date: { order: "desc" } }],
    });

    res.json({
      period: `Last ${days} days`,
      account: account || "all",
      total: result.hits.total,
      page,
      limit,
      emails: result.hits.hits.map((hit: any) => ({
        id: hit._id,
        ...hit._source,
      })),
    });
  } catch (error: any) {
    console.error("❌ Recent emails error:", error);
    res.status(500).json({
      error: "Failed to fetch recent emails",
      details: error.message,
    });
  }
});


/**
 * GET /api/emails/:id
 * Get a specific email by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await esClient.get({
      index: EMAIL_INDEX,
      id: id,
    });

    res.json({
      id: result._id,
      ...(result._source as any),
    });
  } catch (error: any) {
    if (error.meta?.statusCode === 404) {
      res.status(404).json({ error: 'Email not found' });
    } else {
      console.error('❌ Get email error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch email', 
        details: error.message 
      });
    }
  }
});

/**
 * GET /api/emails/stats/accounts
 * Get email count per account
 */
router.get('/stats/accounts', async (req: Request, res: Response) => {
  try {
    const result = await esClient.search({
      index: EMAIL_INDEX,
      size: 0,
      aggs: {
        by_account: {
          terms: {
            field: 'account.keyword',
            size: 10,
          },
          aggs: {
            latest_email: {
              top_hits: {
                size: 1,
                sort: [{ date: 'desc' }],
                _source: ['date', 'subject'],
              },
            },
          },
        },
      },
    });

    const aggregations = result.aggregations as any;
    const accounts = aggregations?.by_account?.buckets?.map((bucket: any) => ({
      account: bucket.key,
      count: bucket.doc_count,
      latestEmail: bucket.latest_email.hits.hits[0]?._source,
    })) || [];

    res.json({ accounts });
  } catch (error: any) {
    console.error('❌ Stats error:', error);
    res.status(500).json({ 
      error: 'Failed to get statistics', 
      details: error.message 
    });
  }
});

/**
 * GET /api/emails/stats/senders?account=email@gmail.com
 * Get top senders (optionally filtered by account)
 */
router.get('/stats/senders', async (req: Request, res: Response) => {
  try {
    const { limit = 10, account } = req.query;

    const query: any = account 
      ? { term: { 'account.keyword': account } }
      : { match_all: {} };

    const result = await esClient.search({
      index: EMAIL_INDEX,
      size: 0,
      query: query,
      aggs: {
        top_senders: {
          terms: {
            field: 'from.keyword',
            size: Number(limit),
          },
          aggs: {
            latest_email: {
              top_hits: {
                size: 1,
                sort: [{ date: 'desc' }],
                _source: ['date', 'subject'],
              },
            },
          },
        },
      },
    });

    const aggregations = result.aggregations as any;
    const senders = aggregations?.top_senders?.buckets?.map((bucket: any) => ({
      email: bucket.key,
      count: bucket.doc_count,
      latestEmail: bucket.latest_email.hits.hits[0]?._source,
    })) || [];

    res.json({ 
      account: account || 'all',
      topSenders: senders 
    });
  } catch (error: any) {
    console.error('❌ Stats error:', error);
    res.status(500).json({ 
      error: 'Failed to get sender statistics', 
      details: error.message 
    });
  }
});

/**
 * POST /api/emails/advanced-search
 * Advanced search with complex filters
 */
router.post('/advanced-search', async (req: Request, res: Response) => {
  try {
    const {
      keywords = [],
      mustHave = [],
      exclude = [],
      senders = [],
      accounts = [],
      dateRange,
      limit = 20,
      offset = 0,
    } = req.body;

    const must: any[] = [];
    const should: any[] = [];
    const mustNot: any[] = [];
    const filter: any[] = [];

    // Required keywords
    mustHave.forEach((keyword: string) => {
      must.push({
        multi_match: {
          query: keyword,
          fields: ['subject', 'body'],
        },
      });
    });

    // Optional keywords
    if (keywords.length > 0) {
      keywords.forEach((keyword: string) => {
        should.push({
          multi_match: {
            query: keyword,
            fields: ['subject', 'body'],
          },
        });
      });
    }

    // Excluded keywords
    exclude.forEach((keyword: string) => {
      mustNot.push({
        multi_match: {
          query: keyword,
          fields: ['subject', 'body'],
        },
      });
    });

    // Sender filter
    if (senders.length > 0) {
      filter.push({
        terms: { 'from.keyword': senders },
      });
    }

    // Account filter
    if (accounts.length > 0) {
      filter.push({
        terms: { 'account.keyword': accounts },
      });
    }

    // Date range
    if (dateRange?.from || dateRange?.to) {
      const range: any = {};
      if (dateRange.from) range.gte = dateRange.from;
      if (dateRange.to) range.lte = dateRange.to;
      filter.push({ range: { date: range } });
    }

    const result = await esClient.search({
      index: EMAIL_INDEX,
      query: {
        bool: {
          must: must.length > 0 ? must : undefined,
          should: should.length > 0 ? should : undefined,
          must_not: mustNot.length > 0 ? mustNot : undefined,
          filter: filter.length > 0 ? filter : undefined,
          minimum_should_match: should.length > 0 ? 1 : undefined,
        },
      },
      from: Number(offset),
      size: Number(limit),
      sort: [{ date: 'desc' }],
    });

    res.json({
      total: result.hits.total,
      results: result.hits.hits.map((hit: any) => ({
        id: hit._id,
        score: hit._score,
        ...hit._source,
      })),
    });
  } catch (error: any) {
    console.error('❌ Advanced search error:', error);
    res.status(500).json({ 
      error: 'Advanced search failed', 
      details: error.message 
    });
  }
});

export default router;