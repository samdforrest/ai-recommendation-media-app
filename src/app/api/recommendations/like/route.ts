import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

export async function POST(req: NextRequest) {
  const token = req.cookies.get('token')?.value;
  console.log('🔑 Received token:', token ? 'Present' : 'Missing');

  if (!token) {
    console.log('❌ Like failed: No authentication token');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Verify the token and get user ID
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
    console.log('🔓 Decoded token:', decoded);
    
    const userId = decoded.id;
    console.log('👤 User attempting to like:', userId);

    const body = await req.json();
    console.log('📦 Received request body:', body);
    
    const { recommendationId } = body;
    console.log('🎯 Extracted recommendationId:', recommendationId);

    if (!recommendationId) {
      console.log('❌ Like failed: No recommendation ID provided');
      return NextResponse.json({ error: 'Recommendation ID is required' }, { status: 400 });
    }

    console.log('🎬 Processing like for recommendation:', recommendationId);

    // Get user's context
    let userContext = await prisma.userContext.findUnique({
      where: { userId },
    });

    if (!userContext) {
      console.log('📝 Creating new user context for:', userId);
      userContext = await prisma.userContext.create({
        data: {
          userId,
          preferredGenres: [],
          recentSearches: [],
          likedRecommendations: [],
        },
      });
    }

    // Toggle like status
    const isLiked = userContext.likedRecommendations.includes(recommendationId);
    const updatedLikes = isLiked
      ? userContext.likedRecommendations.filter((id: string) => id !== recommendationId)
      : [...userContext.likedRecommendations, recommendationId];

    console.log(`${isLiked ? '👎 Unliking' : '👍 Liking'} recommendation:`, recommendationId);

    // Update user context with new likes
    await prisma.userContext.update({
      where: { userId },
      data: {
        likedRecommendations: updatedLikes,
      },
    });

    console.log('✅ Successfully updated likes in database. New count:', updatedLikes.length);

    return NextResponse.json({ 
      success: true, 
      isLiked: !isLiked,
      totalLikes: updatedLikes.length
    });
  } catch (error) {
    console.error('❌ Error in like endpoint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 