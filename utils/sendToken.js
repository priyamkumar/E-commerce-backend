const sendToken = (user, statusCode, res) => {
    const token = user.getJWTToken();

    const options = {
        httpOnly: true,
        maxAge: 15 * 60 * 1000,
    };

    res.status(statusCode).cookie("token", token, options).json({
        success: true,
        user,
        token,
    })
}

module.exports = sendToken;