import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import { Infraction, User } from '@/lib/models';

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { id } = params;
    const infraction = await Infraction.findById(id);

    if (!infraction) {
      return NextResponse.json({ error: 'Infraction not found' }, { status: 404 });
    }

    // Update user points
    const user = await User.findOne({ userId: infraction.userId });
    if (user) {
      user.totalPoints = Math.max(0, user.totalPoints - infraction.points);
      await user.save();
    }

    await Infraction.findByIdAndDelete(id);

    return NextResponse.json({ success: true, message: 'Infraction deleted' });
  } catch (error) {
    console.error('Error deleting infraction:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

