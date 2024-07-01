const router = require("express").Router();
const setup = require("../db_setup");

const sha = require("sha256");

router.get("/logout", (req, res) => {
    console.log("로그아웃");
    req.session.destroy();
    res.render("index.ejs");
});

router.post("/login", async (req, res) => {
    const { mongodb, mysqldb } = await setup();
    mongodb
        .collection("account")
        .findOne({ userid: req.body.userid })
        .then((result) => {
            console.log(result);
            if (result) {
                const sql = `SELECT salt FROM UserSalt 
                    WHERE userid=?`;
                mysqldb.query(sql, [req.body.userid], (err, rows, fields) => {
                    const salt = rows[0].salt;
                    const hashPw = sha(req.body.userpw + salt);
                    //  console.log(hashPw);
                    if (result.userpw == hashPw) {
                        req.body.userpw = hashPw;
                        req.session.user = req.body;//serialize

                        res.cookie("uid", req.body.userid);
                        res.render("index.ejs");
                    } else {
                        res.render("index.ejs", { data: { alertMsg: '다시 로그인 해주세요' } });
                    }
                });
            } else {
                res.render("index.ejs", { data: { alertMsg: '다시 로그인 해주세요' } });
            }
        })
        .catch((err) => {
            res.render("index.ejs", { data: { alertMsg: '다시 로그인 해주세요' } });
        });
});



router.get("/signUp", (req, res) => {
    res.render("signUp.ejs");
});

router.post("/save", async (req, res) => {
    const { mongodb, mysqldb } = await setup();
    mongodb
        .collection("account")
        .findOne({ userid: req.body.userid })
        .then((result) => {
            if (result) {
                res.render("signUp.ejs", { data: { msg: "ID가 중복되었습니다" } });
            } else {
                const generateSalt = (length = 16) => {
                    const crypto = require("crypto");
                    return crypto.randomBytes(length).toString("hex");
                };

                const salt = generateSalt();
                req.body.userpw = sha(req.body.userpw + salt);
                req.body.confirmPassword = sha(req.body.confirmPassword + salt);
                mongodb
                    .collection("account")
                    .insertOne(req.body)
                    .then((result) => {
                        if (result) {
                            console.log("회원가입 성공");

                            //MySQL에 salt를 저장
                            const sql = `INSERT INTO UserSalt (userid, salt)
                    VALUES (?,?)`;
                            mysqldb.query(sql, [req.body.userid, salt], (err, result2) => {
                                if (err) {
                                    console.log(err);
                                } else {
                                    console.log("salt 저장 성공");
                                }
                            });
                            res.redirect("/");
                        } else {
                            console.log("회원가입 fail");
                            res.render("signUp.ejs", { data: { alertMsg: "회원가입 fail" } });
                        }
                    })
                    .catch((err) => {
                        console.log(err);
                        res.status(500).send();
                    });
            }
        })
        .catch((err) => {
            console.log(err);
            res.status(500).send();
        });
});


router.post('/overlapped', async (req, res) => {
    const { userid } = req.body;
    const { mongodb } = await setup();

    try {
        // MongoDB에서 userId로 검색
        const existingUser = await mongodb
            .collection('account')
            .findOne({ userid: userid });

        if (existingUser) {
            res.send('true'); // 중복된 아이디가 있음을 클라이언트에게 응답
        } else {
            res.send('false'); // 중복된 아이디가 없음을 클라이언트에게 응답
        }
    } catch (error) {
        console.error("MongoDB 조회 에러:", error);
        res.status(500).send('error');
    }
});

module.exports = router;
