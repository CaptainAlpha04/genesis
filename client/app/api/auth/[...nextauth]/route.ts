import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import User from "../../../../models/User";
import connectDB from "../../../db/connectDB";
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

// Connect to the database
connectDB();

const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Connect to the database
      await connectDB();

      try {
        if (!user.email) {
          console.error("User email is not available");
          return false;
        }

        // Check if the user already exists in the database
        let existingUser = await User.findOne({ email: user.email });

        // If the user doesn't exist, create a new user
        if (!existingUser) {
          existingUser = new User({
            email: user.email,
            name: user.name,
            username: user.email.split("@")[0], // Use the part before '@' as username
          });
          await existingUser.save();
        }

        return true;
      } catch (error) {
        console.error("Error checking or creating user:", error);
        return false;
      }
    },
    async session({ session, token, user }) {
      if (session.user?.email) {
        const existingUser = await User.findOne({ email: session.user.email });
        if (existingUser) {
          session.user.id = existingUser._id.toString();
        }
      }
      return session;
    }, async redirect({ url, baseUrl }) {
      return baseUrl; // Redirect to the main page after successful login
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
