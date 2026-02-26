const Sale = require('../models/Sale');

 // Convierte "YYYY-MM-DD" a Date LOCAL.

function parseYMDLocal(ymd) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(ymd).trim());
  if (!m) return null;

  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  return new Date(year, month - 1, day);
}

function startOfDayLocal(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDayLocal(date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

// GET /api/dashboard/summary?from=YYYY-MM-DD&to=YYYY-MM-DD

async function getDashboardSummary(req, res) {
  try {
    const fromQ = String(req.query.from ?? '').trim();
    const toQ = String(req.query.to ?? '').trim();

    const todayLocal = new Date();

    const parsedFrom = fromQ ? parseYMDLocal(fromQ) : null;
    const parsedTo = toQ ? parseYMDLocal(toQ) : null;

    if (fromQ && !parsedFrom) {
      return res.status(400).json({
        error: 'Invalid query parameters',
        details: [{ field: 'from', value: fromQ, message: 'from must be YYYY-MM-DD' }],
      });
    }
    if (toQ && !parsedTo) {
      return res.status(400).json({
        error: 'Invalid query parameters',
        details: [{ field: 'to', value: toQ, message: 'to must be YYYY-MM-DD' }],
      });
    }

    const from = startOfDayLocal(parsedFrom ?? todayLocal);
    const to = endOfDayLocal(parsedTo ?? todayLocal);

    const [result] = await Sale.aggregate([
      {
        $match: {
          createdAt: { $gte: from, $lte: to },
        },
      },
      {
        $facet: {
          totals: [
            {
              $group: {
                _id: '$status',
                count: { $sum: 1 },
                revenue: {
                  $sum: {
                    $cond: [{ $eq: ['$status', 'completed'] }, '$total', 0],
                  },
                },
              },
            },
          ],

          avgTicket: [
            { $match: { status: 'completed' } },
            {
              $group: {
                _id: null,
                avg: { $avg: '$total' },
              },
            },
          ],

          topProducts: [
            { $match: { status: 'completed' } },
            { $unwind: '$items' },
            {
              $group: {
                _id: '$items.productNameSnapshot',
                qty: { $sum: '$items.quantity' },
                amount: { $sum: '$items.lineTotal' },
              },
            },
            { $sort: { qty: -1 } },
            { $limit: 8 },
            {
              $project: {
                _id: 0,
                name: '$_id',
                qty: 1,
                amount: 1,
              },
            },
          ],
        },
      },
    ]);

    const totals = result?.totals ?? [];
    const completed = totals.find((t) => t._id === 'completed')?.count ?? 0;
    const canceled = totals.find((t) => t._id === 'canceled')?.count ?? 0;
    const revenue = totals.reduce((sum, t) => sum + (t.revenue || 0), 0);

    const avg = result?.avgTicket?.[0]?.avg ?? 0;

    return res.json({
      range: { from, to },
      sales: {
        completed,
        canceled,
        total: completed + canceled,
      },
      revenue: Number(revenue.toFixed(2)),
      avgTicket: Number(avg.toFixed(2)),
      topProducts: result?.topProducts ?? [],
    });
  } catch (err) {
    console.error('getDashboardSummary error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { getDashboardSummary };