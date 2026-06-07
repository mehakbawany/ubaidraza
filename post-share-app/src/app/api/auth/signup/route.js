import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hashPassword, signToken } from '@/lib/auth';
import { uploadImage } from '@/lib/cloudinary';

export async function POST(request) {
  try {
    const { email, password, name, profileImage } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    // Check if database URL is configured
    try {
      await prisma.$connect();
    } catch (dbError) {
      console.error('Database connection failed:', dbError);
      return NextResponse.json(
        { error: 'Database connection failed. Please ensure the MongoDB URL is configured in .env file.' },
        { status: 503 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Upload image to Cloudinary (or local fallback)
    let imageUrl = null;
    if (profileImage) {
      try {
        imageUrl = await uploadImage(profileImage, 'avatar');
      } catch (uploadError) {
        console.error('Image upload failed, continuing with fallback:', uploadError);
        imageUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`;
      }
    } else {
      imageUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`;
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        profileImage: imageUrl,
      },
    });

    // Create JWT
    const token = signToken({ id: user.id, email: user.email });

    // Set cookie
    const response = NextResponse.json(
      {
        message: 'Signup successful',
        user: { id: user.id, email: user.email, name: user.name, profileImage: user.profileImage },
      },
      { status: 201 }
    );

    response.cookies.set({
      name: 'token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
      sameSite: 'lax',
    });

    return response;
  } catch (error) {
    console.error('Signup API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
