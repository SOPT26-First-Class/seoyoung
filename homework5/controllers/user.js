const crypto = require('crypto');
const Users = require('../models/user');
const util = require('../modules/util');
const statusCode = require('../modules/statusCode');
const resMessage = require('../modules/responseMessage');
const jwt = require('../modules/jwt');

const user = {
    //회원가입

    /* 
    ✔️ sign up
    METHOD : POST
    URI : localhost:3000/user/signup
    REQUEST BODY : id, name, password, email
    RESPONSE STATUS : 200 (OK)
    RESPONSE DATA : User ID
    */

    signup: async (req, res) => {
        // request body에서 데이터 받아오기
        const {
            id,
            name,
            password,
            email
        } = req.body;

        // request data 확인 - 없다면 Null Value 반환
        if (!id || !name || !password || !email) {
            res.status(statusCode.BAD_REQUEST)
                .send(util.fail(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
            return;
        }

        //already ID
        const isAlready = await Users.checkUser(id)
        if (isAlready) {
            res.status(statusCode.BAD_REQUEST)
                .send(util.fail(statusCode.BAD_REQUEST, resMessage.ALREADY_ID));
            return;
        }

        // password salt, hash 값으로 저장

        const salt = await crypto.randomBytes(32).toString('hex');
        const hash = await crypto.pbkdf2Sync(password, salt.toString(), 1, 32, 'sha512').toString('hex');

        // User.push({id, name, password, email});
        const idx = await Users.signup(id, name, hash, salt, email);
        if (idx === -1) {
            return res.status(statusCode.DB_ERROR)
                .send(util.fail(statusCode.DB_ERROR, resMessage.DB_ERROR));
        }
        // 회원가입 성공
        res.status(statusCode.OK)
            .send(util.success(statusCode.OK, resMessage.CREATED_USER, {
                userId: id
            }));
    },

    // 로그인

    /* 
    ✔️ sign in
    METHOD : POST
    URI : localhost:3000/user/signin
    REQUEST BODY : id, password
    RESPONSE STATUS : 200 (OK)
    RESPONSE DATA : User ID
    */

    signin: async (req, res) => {
        // request body에서 데이터 가져오기
        const {
            id,
            password
        } = req.body;

        // request data확인 없다면 NULL_VALUE
        if (!id || !password) {
            res.status(statusCode.BAD_REQUEST)
                .send(util.fail(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
            return;
        }

        // 존재하는 아이디인지 확인 없으면 NO-USER
        const isUser = await Users.checkUser(id)
        if (!isUser) {
            res.status(statusCode.BAD_REQUEST)
                .send(util.fail(statusCode.BAD_REQUEST, resMessage.NO_USER));
            return;
        }

        // user 정보 데려오기
        const isMatch = await Users.signin(id, password)
        if (isMatch) {
            //성공 - LOGIN_SUCCESS
            // 유저정보 가져오기
            const user = await Users.getUserById(id)
            const {
                token,
                _
            } = await jwt.sign(user);

            // 로그인이 성공적으로 마쳤다면 - LOGIN_SUCCESS 전달
            res.status(statusCode.OK)
                .send(util.success(statusCode.OK, resMessage.LOGIN_SUCCESS, {
                    accessToken: token
                }));
        } else {
            // 비밀번호 확인 - 일치하지 않으면 MISS_MATCH_PW
            res.status(statusCode.BAD_REQUEST)
                .send((util.fail(statusCode.BAD_REQUEST, resMessage.MISS_MATCH_PW)));
            return;
        }
    },

    // 프로필 조회

    /* 
    ✔️ get profile
    METHOD : GET
    URI : localhost:3000/user/profile/:id
    RESPONSE STATUS : 200 (OK)
    RESPONSE DATA : User Id, name, email
    */

    getProfile: async (req, res) => {

        // request params 에서 데이터 가져오기
        const id = req.params.id;

        // 존재하는 아이디인지 확인 - 없다면 No user 반환
        const isUser = await Users.checkUser(id)
        if (!isUser) {
            res.status(statusCode.BAD_REQUEST)
                .send(util.fail(statusCode.BAD_REQUEST, resMessage.NO_USER));
            return;
        }

        const user = await Users.getUserById(id)

        // 성공 - login success와 함께 user Id 반환
        res.status(statusCode.OK).send(util.success(statusCode.OK, resMessage.READ_PROFILE_SUCCESS, user));

    }

}

module.exports = user;