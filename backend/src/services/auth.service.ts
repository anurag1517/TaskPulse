import { CreateAccountInput } from "../payloadSchema/auth.schema";
import { prisma } from "../lib/prisma";
import { AppError } from "../error/appError";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { env } from "../config/env";

class AuthService {
    async initiateSignup(signupData: CreateAccountInput) {
        const { email, password } = signupData;
        const normalizedEmail = email.trim().toLowerCase();
        const hashedPassword = await bcrypt.hash(password, 12);
        const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
        if (existingUser) {
            throw new AppError(400, "User already exists")
        }

        const user = await prisma.user.create({
            data: {
                email: normalizedEmail,
                password: hashedPassword,
            },
        });
        return user
    }

    async login(email: string, plainPassword: string) {
        if (!email || !plainPassword) {
            throw new AppError(400, 'Email and password are required');
        }

        const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });

        if (!user) {
            throw new AppError(401, 'Invalid login credentials');
        }

        const isMatch = await bcrypt.compare(plainPassword, user.password);

        if (!isMatch) {
            throw new AppError(401, 'Invalid login credentials');
        }

        const payload = {
            id: user.id,
            email: user.email,
        };

        const token = jwt.sign(payload, env.userJwtSecret, {
            expiresIn: env.key_expiry,
        });

        return { token, user: payload };
    }

    async getCurrentUser(userId: number) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
            },
        });

        if (!user) {
            throw new AppError(404, 'User not found');
        }

        return user;
    }
}

export const authService = new AuthService();
