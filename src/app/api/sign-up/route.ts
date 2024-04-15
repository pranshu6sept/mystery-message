import dbConnect from "@/lib/dbConnect";
import UserModel from "@/model/User";
import bcrypt from "bcryptjs"

import { sendVerificationEmail } from "@/helpers/sendVerificationEmail";

export async function POST (request: Request) {
    await dbConnect()

    try {
        const {username,email,password} = await request.json();

        const existingUserVerifiedUsername = await UserModel.findOne({
            username,
            isVerified:true
        });

        if (existingUserVerifiedUsername){
            return Response.json({
                success:false,
                message:"Username is already taken"
            })
        }

        const existingUserByEmail = await UserModel.findOne({email})
        const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();

        if (existingUserByEmail) {
            if(existingUserByEmail.isVerified) {
                return Response.json({
                    success:false,
                    message:"User already registered with this email"
                },{status:400})
            } else {
                const hasedPassword = await bcrypt.hash(password,10);
                existingUserByEmail.password = hasedPassword;
                existingUserByEmail.verifyCode = verifyCode;
                existingUserByEmail.verifyCodeExpiry = new Date(Date.now() + 3600000);

                await existingUserByEmail.save();
            }
        } else {
            const hasedPassword = await bcrypt.hash(password,10);
            const expityDate = new Date()
            expityDate.setHours(expityDate.getHours() + 1)

            const newUser = new UserModel({
                username,
                email,
                password: hasedPassword,
                verifyCode,
                verifyCodeExpiry: expityDate,
                isVerified: false,
                isAcceptingMessages: true,
                messages:[],
            })

            await newUser.save();
        }

        // send verification email

        const emailResponse = await sendVerificationEmail(
            email,
            username,
            verifyCode
        )

        if (!emailResponse.success){
            return Response.json({
                success:false,
                message:emailResponse.message
            },{status:500})
        }

        return Response.json({
            success:true,
            message:"User registered successfully,Please Verify your email"
        },{status:201})
        
    } catch (error) {
        console.log('Error Registering user', error);
        return Response.json(
            {
                success:false,
                message:"Error registering User"
            },
            {
                status:500
            }
        )
    }
}