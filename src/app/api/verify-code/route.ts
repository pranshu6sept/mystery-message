import dbConnect from "@/lib/dbConnect";
import UserModel from "@/model/User";

export async function POST(request:Request) {
    await dbConnect()

    try {
        const {username,code} = await request.json()

        const decodeUsername = decodeURIComponent(username)

        const user = await UserModel.findOne({username:decodeUsername})

        if(!user) {
            return Response.json(
                {
                    sucess:false,
                    message:"User not found"
                },
                {
                    status:500
                }
            )
        }
        
        const isCodeValid = user.verifyCode === code
        const isCodeNotExpired = new Date(user.verifyCodeExpiry) > new Date()

        if (isCodeValid || isCodeNotExpired) {
            user.isVerified = true
            await user.save()

            return Response.json(
                {
                    sucess:true,
                    message:"User verified successfully"
                },
                {
                    status:200
                }
            )
        } else if (!isCodeNotExpired) {
            return Response.json(
                {
                    sucess:false,
                    message:"Verification Code has expired please signup again to get new code"
                },
                {
                    status:400
                }
            )
            } else {
                return Response.json(
                    {
                        sucess:false,
                        message:"Incorrect Verification Code "
                    },
                    {
                        status:400
                    }
                )
            }
    } catch (error) {
        console.error("Error verifying user", error)
        return Response.json(
            {
                sucess:false,
                message:"Error verifying user"
            },
            {
                status:500
            }
        )
    }
}