import NextAuth from 'next-auth';
import { authOptions } from '@/lib/authOptions'; // Adjust if path is different

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
