import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import {User} from "../models/User.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

import ApiResponse from "../utils/ApiResponse.js";

const generateAccessAndRefreshTokens = async(userId) => {
    try{
        const user = await User.findById(userId);
        const refreshToken = user.generateRefreshToken();
        const accessToken = user.generateAccessToken();

        user.refreshToken = refreshToken;
        await user.save({
            validateBeforeSave: false
        });

        return {
            accessToken,
            refreshToken
        }
    }
    catch(error){
        throw new ApiError(500, "Failed to generate tokens");
    }
}

const registerUser = asyncHandler(async (req , res) =>{
    // Registration logic here
    // res.status(200).json({
    //     message: "User registered successfully"
    // });

    const {fullName, email, username, password} = req.body;
    console.log("email:", email);

    if(
        [fullName, email, username, password].some((field) => 
        field?.trim() === "")
    ){
        throw new ApiError(400, "All fields are required");
    }

    const existedUser = await User.findOne({
        $or: [{ email }, { username }]
    })

    if(existedUser){
        throw new ApiError(409, "User with given email or username already exists");
    }

    const avatarLocalPath = req.files?.avatar[0]?.path
    const coverImageLocalPath =  req.files?.coverImage[0]?.path

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar image is required");
    };

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if(!avatar){
        throw new ApiError(400, "Failed to upload avatar image");
    }

    const user = await User.create({
        fullName,
        email,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        password,
        username: username.toLowerCase()
    });

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500, "Something went wrong while registering user");
    }


    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    );
});

const loginUser = asyncHandler(async (req , res) =>{
    // Login logic here
    const { email, username, password } = req.body;

    if(!email || !username){
        throw new ApiError(400, "Email or username is required");
    }

    const user = await User.findOne({
        $or: [{ email }, { username }]    
    })

    if(!user){
        throw new ApiError(404, "User not found");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);
    if(!isPasswordValid){
        throw new ApiError(401, "Invalid password");
    }

    const {accessToken , refreshToken} = await generateAccessAndRefreshTokens(user._id);

    const loggedInUser = User.findById(user._id).
    select("-password -refreshToken");

    const options = {
        httpOnly: true,
        secure: true
    };

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200, 
            {
                user: loggedInUser,
                accessToken,
                refreshToken
            },
            "User logged in successfully"
        )
    )
});

const logoutUser = asyncHandler(async (req , res) =>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true,
        }
    )
    const options = {
        httpOnly: true,
        secure: true
    };

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
        new ApiResponse(200, {}, "User logged out successfully")
    );
});


export {
    registerUser, 
    loginUser,
    logoutUser
};