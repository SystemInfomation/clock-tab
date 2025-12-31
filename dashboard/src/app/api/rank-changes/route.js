import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import dbConnect from '@/lib/mongodb';
import { RankChange } from '@/lib/models';
import { 
  sanitizeMongoQuery, 
  validateUserId, 
  validatePagination, 
  validateDate,
  rateLimit,
  getClientIP,
  createErrorResponse
} from '@/lib/security';

export async function GET(request) {
  try {
    // Rate limiting
    const clientIP = getClientIP(request);
    if (!rateLimit(`rank-changes:${clientIP}`, 100, 60000)) {
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
    
    // Validate and sanitize inputs
    let userId = searchParams.get('userId');
    let staffId = searchParams.get('staffId');
    let rank = searchParams.get('rank');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = searchParams.get('page');
    const limit = searchParams.get('limit');

    const query = {};
    
    if (userId) {
      try {
        userId = validateUserId(userId);
        query.userId = sanitizeMongoQuery(userId);
      } catch (error) {
        return NextResponse.json(
          { error: 'Invalid user ID' },
          { status: 400 }
        );
      }
    }
    
    if (staffId) {
      try {
        staffId = validateUserId(staffId);
        query.staffId = sanitizeMongoQuery(staffId);
      } catch (error) {
        return NextResponse.json(
          { error: 'Invalid staff ID' },
          { status: 400 }
        );
      }
    }
    
    if (rank) {
      // Sanitize rank string
      rank = sanitizeMongoQuery(rank);
      if (rank.length > 50) {
        return NextResponse.json(
          { error: 'Invalid rank' },
          { status: 400 }
        );
      }
      query.newRank = rank;
    }
    
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) {
        try {
          query.timestamp.$gte = validateDate(startDate);
        } catch (error) {
          return NextResponse.json(
            { error: 'Invalid start date' },
            { status: 400 }
          );
        }
      }
      if (endDate) {
        try {
          query.timestamp.$lte = validateDate(endDate);
        } catch (error) {
          return NextResponse.json(
            { error: 'Invalid end date' },
            { status: 400 }
          );
        }
      }
    }

    let pageNum, limitNum;
    try {
      ({ page: pageNum, limit: limitNum } = validatePagination(page, limit));
    } catch (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    const skip = (pageNum - 1) * limitNum;
    const rankChanges = await RankChange.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    const total = await RankChange.countDocuments(query);

    return NextResponse.json({
      rankChanges,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching rank changes:', error);
    const isDev = process.env.NODE_ENV === 'development';
    return NextResponse.json(
      createErrorResponse(error, 500, isDev),
      { status: 500 }
    );
  }
}

