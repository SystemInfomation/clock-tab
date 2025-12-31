import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import dbConnect from '@/lib/mongodb';
import { Infraction, User } from '@/lib/models';
import { 
  sanitizeMongoQuery, 
  rateLimit,
  getClientIP,
  createErrorResponse
} from '@/lib/security';
import { requireStaffRole } from '@/lib/authorization';

export async function DELETE(request, { params }) {
  try {
    // Rate limiting (stricter for DELETE operations)
    const clientIP = getClientIP(request);
    if (!rateLimit(`delete:${clientIP}`, 20, 60000)) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // SECURITY: Require staff role for deletion - uses secure token access
    const isStaff = await requireStaffRole(
      session.user.id,
      request,
      process.env.DISCORD_GUILD_ID
    );
    
    if (!isStaff) {
      return NextResponse.json(
        { error: 'Forbidden - Staff role required' },
        { status: 403 }
      );
    }

    await dbConnect();

    const { id } = params;
    
    // Validate and sanitize ID
    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'Invalid infraction ID' },
        { status: 400 }
      );
    }

    const sanitizedId = sanitizeMongoQuery(id);
    const infraction = await Infraction.findById(sanitizedId);

    if (!infraction) {
      return NextResponse.json({ error: 'Infraction not found' }, { status: 404 });
    }

    // Update user points
    const user = await User.findOne({ userId: infraction.userId });
    if (user) {
      user.totalPoints = Math.max(0, user.totalPoints - (infraction.points || 0));
      await user.save();
    }

    await Infraction.findByIdAndDelete(sanitizedId);

    return NextResponse.json({ success: true, message: 'Infraction deleted' });
  } catch (error) {
    console.error('Error deleting infraction:', error);
    const isDev = process.env.NODE_ENV === 'development';
    return NextResponse.json(
      createErrorResponse(error, 500, isDev),
      { status: 500 }
    );
  }
}

