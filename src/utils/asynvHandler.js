// Promise VERSION
const asyncHandler = (requestHandler) => {
    (req, res, next) => {
        Promise.resolve(requestHandler(res, req, next)).catch((error) => {
            next(error);
        })
    }
}
export default asyncHandler;



// TRY CATCH CODE VERSION
/*
const asyncHandler = (fn) => async(req,res,next) => {
    try {
        await fn(req,res,next);
    }
    catch(error) {  
        res.status(error.code || 500).json({
            success: false,
            message: error.message || "Internal Server Error"
        });
    }
}
*/