import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import dbConnect from '@/lib/mongodb';
import { User, Infraction, RankChange } from '@/lib/models';
import { 
  validateUserId,
  sanitizeMongoQuery,
  rateLimit,
  getClientIP,
  createErrorResponse
} from '@/lib/security';

export async function GET(request, { params }) {
  try {
    // Rate limiting
    const clientIP = getClientIP(request);
    if (!rateLimit(`users:${clientIP}`, 100, 60000)) {
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

    let { userId } = params;
    
    // Validate and sanitize user ID
    try {
      userId = validateUserId(userId);
      userId = sanitizeMongoQuery(userId);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    const user = await User.findOne({ userId }).lean();
    const infractions = await Infraction.find({ userId }).sort({ timestamp: -1 }).lean();
    const rankChanges = await RankChange.find({ userId }).sort({ timestamp: -1 }).lean();

    const stats = {
      totalPoints: user?.totalPoints || 0,
      totalInfractions: infractions.length,
      warnings: infractions.filter(i => i.type === 'warning').length,
      mutes: infractions.filter(i => i.type === 'mute').length,
      kicks: infractions.filter(i => i.type === 'kick').length,
      bans: infractions.filter(i => i.type === 'ban').length,
      lastActionDate: user?.lastActionDate || null,
      currentRank: user?.currentRank || null
    };

    return NextResponse.json({
      user: user || { userId, totalPoints: 0, currentRank: null, lastActionDate: null },
      infractions,
      rankChanges,
      stats
    });
  } catch (error) {
    console.error('Error fetching user data:', error);
    const isDev = process.env.NODE_ENV === 'development';
    return NextResponse.json(
      createErrorResponse(error, 500, isDev),
      { status: 500 }
    );
  }
}

