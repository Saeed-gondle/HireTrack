import axios from "axios";
import NextAuth, { User } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      credentials: {
        email: {
          type: "email",
          label: "Email",
          placeholder: "johndoe@gmail.com",
        },
        password: {
          type: "password",
          label: "Password",
          placeholder: "*****",
        },
        token: {
          type: "text",
          label: "Token",
          placeholder: "magic login Token",
        },
      },
      authorize: async (credentials) => {
        let res;
        // logic to salt and hash password
        // const pwHash = saltAndHashPassword(credentials.password);

        try {
          if (credentials?.token) {
            res = await axios.post(
              process.env.NEXT_PUBLIC_API_URL +
              `/auth/magic-login/${credentials.token}`,
              {
                token: credentials.token,
              },
            );
          } else {
            res = await axios.post(
              process.env.NEXT_PUBLIC_API_URL + "/users/login",
              {
                email: credentials.email,
                password: credentials.password,
              },
            );
          }
        } catch (error) {
          console.error("Login error:", error);
        }

        if (!res || res.status !== 200) {
          throw new Error("Invalid credentials.");
        }
        const { user } = res.data.data;
        const loggedInUser: User = {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          company: user.company,
          avatar: user.avatar_url,
          backendAccessToken: res.data.token, // Your Express JWT
        };
        return loggedInUser;
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.isVerified = token.isVerified;
        session.user = token.user;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.user = user;
        token.id = user.id?.toString();
        token.isVerified = user.isVerified;
        token.role = user.role;
        token.company = user.company;
      }
      return token;
    },
  },
  pages: {
    signIn: "/signin",
  },
  session: {
    strategy: "jwt",
  },
});
