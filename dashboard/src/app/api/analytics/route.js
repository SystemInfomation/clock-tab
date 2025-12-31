import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import dbConnect from '@/lib/mongodb';
import { Infraction, RankChange } from '@/lib/models';
import { 
  sanitizeMongoQuery,
  rateLimit,
  getClientIP,
  createErrorResponse
} from '@/lib/security';

// Force dynamic rendering since we use getServerSession (which uses headers)
export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    // Rate limiting
    const clientIP = getClientIP(request);
    if (!rateLimit(`analytics:${clientIP}`, 50, 60000)) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    let period = searchParams.get('period') || 'week'; // week, month, year

    // Validate period
    const validPeriods = ['week', 'month', 'year'];
    period = sanitizeMongoQuery(period);
    if (!validPeriods.includes(period)) {
      return NextResponse.json(
        { error: 'Invalid period. Must be: week, month, or year' },
        { status: 400 }
      );
    }

    const now = new Date();
    let startDate = new Date();

    switch (period) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 7);
    }

    // Infractions over time
    const infractions = await Infraction.find({
      timestamp: { $gte: startDate }
    }).lean();

    // Group by date
    const infractionsByDate = {};
    infractions.forEach(inf => {
      const date = new Date(inf.timestamp).toISOString().split('T')[0];
      infractionsByDate[date] = (infractionsByDate[date] || 0) + 1;
    });

    // Most active staff
    const staffActivity = {};
    infractions.forEach(inf => {
      staffActivity[inf.staffId] = (staffActivity[inf.staffId] || 0) + 1;
    });
    const topStaff = Object.entries(staffActivity)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([staffId, count]) => ({ staffId, count }));

    // Most disciplined users
    const userActivity = {};
    infractions.forEach(inf => {
      userActivity[inf.userId] = (userActivity[inf.userId] || 0) + 1;
    });
    const topUsers = Object.entries(userActivity)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([userId, count]) => ({ userId, count }));

    // Infraction types distribution
    const typeDistribution = {
      warning: infractions.filter(i => i.type === 'warning').length,
      mute: infractions.filter(i => i.type === 'mute').length,
      kick: infractions.filter(i => i.type === 'kick').length,
      ban: infractions.filter(i => i.type === 'ban').length
    };

    // Rank changes count
    const rankChangesCount = await RankChange.countDocuments({
      timestamp: { $gte: startDate }
    });

    // Calculate average per day
    const daysDiff = Math.ceil((now - startDate) / (1000 * 60 * 60 * 24));
    const averagePerDay = daysDiff > 0 ? infractions.length / daysDiff : 0;

    return NextResponse.json({
      infractionsByDate: Object.entries(infractionsByDate).map(([date, count]) => ({ date, count })),
      topStaff,
      topUsers,
      typeDistribution,
      rankChangesCount,
      totalInfractions: infractions.length,
      averagePerDay,
      period,
      startDate,
      endDate: now
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    const isDev = process.env.NODE_ENV === 'development';
    return NextResponse.json(
      createErrorResponse(error, 500, isDev),
      { status: 500 }
    );
  }
}

