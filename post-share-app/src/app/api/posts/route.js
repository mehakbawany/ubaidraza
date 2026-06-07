import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { uploadImage } from '@/lib/cloudinary';

// GET all posts
export async function GET(request) {
  try {
    // Check if database URL is configured
    try {
      await prisma.$connect();
    } catch (dbError) {
      console.error('Database connection failed in GET /api/posts:', dbError);
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 503 }
      );
    }

    const posts = await prisma.post.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        },
      },
    });

    return NextResponse.json({ posts }, { status: 200 });
  } catch (error) {
    console.error('GET posts API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST create a post
export async function POST(request) {
  try {
    const tokenCookie = request.cookies.get('token');
    const token = tokenCookie?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded || !decoded.id) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Check if database URL is configured
    try {
      await prisma.$connect();
    } catch (dbError) {
      console.error('Database connection failed in POST /api/posts:', dbError);
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 503 }
      );
    }

    const { content, image } = await request.json();

    if (!content || content.trim() === '') {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    // Upload post image if present
    let imageUrl = null;
    if (image) {
      try {
        imageUrl = await uploadImage(image, 'post');
      } catch (uploadError) {
        console.error('Post image upload failed:', uploadError);
        // We can choose to fail the request or continue without the image.
        // Let's continue without the image, or return an error. Let's return error since user explicitly uploaded it.
        return NextResponse.json(
          { error: 'Failed to upload post image' },
          { status: 500 }
        );
      }
    }

    const post = await prisma.post.create({
      data: {
        content,
        image: imageUrl,
        authorId: decoded.id,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        },
      },
    });

    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    console.error('POST post API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
