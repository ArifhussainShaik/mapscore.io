import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import clientPromise from "@/libs/mongo";

export const authOptions = {
    adapter: MongoDBAdapter(clientPromise, { databaseName: "Localscore" }),
    providers: [
        GoogleProvider({
            // Accept either naming so a Vercel/.env mismatch can't silently break OAuth.
            clientId: process.env.GOOGLE_ID || process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET,
        }),
    ],
    callbacks: {
        session: async ({ session, user }) => {
            session.user.id = user.id;
            session.user.credits = user.credits || 0;
            session.user.is_lifetime = user.is_lifetime || false;
            return session;
        },
    },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
