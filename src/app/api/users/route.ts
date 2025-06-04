import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {id, email, name, password } = body;
    //console.log("🔍 Prisma is", prisma);
    
    if (!prisma) {
      return new Response("Prisma client is undefined", { status: 500 });
    }
      

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // 🔒 Hash the password securely
    const passwordHash = await bcrypt.hash(password, 10); // 10 is a safe salt round count

    console.log("Creating user with data:", { id, email, name, passwordHash });

    console.log('Prisma models available:', Object.keys(prisma));


    const user = await prisma.user.create({
      data: {
        id,
        name,
        email,
        passwordHash,
      },
    });
    console.log("Received request body:", body);

    if (!prisma?.user) {
        console.error('❌ prisma.user is undefined!');
        return NextResponse.json({ error: 'Prisma user model not available' }, { status: 500 });
    }


    return NextResponse.json({ message: 'User created', user });
  } catch (error: unknown) {
        console.error("Error in POST /api/users:", error instanceof Error ? error.message : 'Unknown error', error instanceof Error ? error.stack : undefined);
        return NextResponse.json({ 
          error: error instanceof Error ? error.message : 'Internal Server Error' 
        }, { status: 500 });
  }
}
