import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
//import jwt from 'jsonwebtoken';

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

    // Compare password
    const passwordMatch = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatch) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    // 🔐 (Mandatory) Set a cookie or JWT here if you want persistent login

    return NextResponse.json({ message: 'Login successful', user: { id: user.id, name: user.name, email: user.email } });
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
