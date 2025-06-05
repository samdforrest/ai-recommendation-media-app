import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    // Find user in DB
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    // Compare password using bcrypt while making sure password is hashed in the database
    const passwordMatch = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatch) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET environment variable is not set');
    }

    // 🔐 (Mandatory) Set a cookie or JWT here if you want persistent login
    // Create a jwt that stores the token in a HTTP-only cookie
    const token = jwt.sign({ id: user.id, name: user.name, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d'});

    // Set HTTP-only cookie with the token for authentication
    const res = NextResponse.json({ message: 'Login successful', user: { id: user.id, name: user.name, email: user.email } });
    res.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });
    return res;
  } catch (err: unknown) {
    console.error('Login error:', err instanceof Error ? err.message : 'Unknown error', err instanceof Error ? err.stack : undefined);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }

  /* Create JWT
  const token = jwt.sign(
    { userId: user.id },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  );
  
  return NextResponse.json(
    { message: 'Login success' },
    {
      status: 200,
      headers: {
        'Set-Cookie': `token=${token}; HttpOnly; Path=/; Max-Age=604800`, // 7 days
      },
    }
  );
  */
}
