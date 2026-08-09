const errorHandler = (err , req , res , next) => {
    console.log("error : " , err.stack)

    const code = err.statusCode || (res.statusCode === 200 ? 500 : res.statusCode)

    res.status(code).json({
        success: false,
        status: code,
        message: err.message || "Internal Server Error",
    });
} 

module.exports = errorHandler