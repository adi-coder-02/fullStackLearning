import mongoose, {Schema} from "mongoose";

const videoSchema = new Schema(
    {
        videoFile: {
            type: String, // cloudinary public_id
            required: true,
        },
        thumbnail: {
            type: String, // cloudinary public_id
            required: true,
        },
        title: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        duration: {
            type: Number, // duration in seconds
            required: true,
        },
        views: {
            type: Number,
            default: 0,
        },
        isPublisheshed: {
            type: Boolean,
            default: true,
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User",
        }
    },
    {
        timestamps: true
    }
);

export const Video = mongoose.model("Video", videoSchema);