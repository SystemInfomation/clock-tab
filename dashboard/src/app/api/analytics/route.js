import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import { Infraction, RankChange } from '@/lib/models';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'week'; // week, month, year

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

    return NextResponse.json({
      infractionsByDate: Object.entries(infractionsByDate).map(([date, count]) => ({ date, count })),
      topStaff,
      topUsers,
      typeDistribution,
      rankChangesCount,
      period,
      startDate,
      endDate: now
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

