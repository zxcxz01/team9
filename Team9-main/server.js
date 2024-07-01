const mongoclient = require("mongodb").MongoClient;
const ObjId = require("mongodb").ObjectId;
////////////////////////////////////////////
const setup = require("./db_setup");
const express = require("express");
const app = express();


const session = require("express-session");
app.use(
  session({
    secret: "암호화키",
    resave: false,
    saveUninitialized: false,
  })
);

const cookieParser = require("cookie-parser");
app.use(cookieParser());

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));

// 'templates' 폴더를 뷰 디렉토리로 설정
//const path = require("path"); // path 모듈 임포트
//app.set('views', path.join(__dirname, 'templates'));// templates는 임의의 폴더명
app.set('view engine', 'ejs'); // 이 설정은 없어도 무방

//라우팅 
app.get("/", (req, res) => {
  res.render("index.ejs");
});

app.use('/', require('./routes/account.js'));

app.listen(8080, async () => {
  await setup();
  console.log("8080 서버가 준비되었습니다...");
});

////////////////////////////////////////////

let mydb;

//정적 파일 라이브러리 추가
app.use(express.static("public"));

app.get("/", function (req, res) {
  res.render("index.ejs");
});

app.post("/delete", function (req, res) {
  console.log(req.body);
  req.body._id = new ObjId(req.body._id);
  mydb
    .collection("account")
    .deleteOne(req.body)
    .then((result) => {
      console.log("매수");
      res.status(200).send();
    })
    .catch((err) => {
      console.log(err);
      res.status(500).send();
    });
});


//team9

app.get('/login', (req, res) => {
  console.log('login페이지 접속');
  res.render('login.ejs');
})

app.get('/signUp', (req, res) => {
  console.log('회원가입 페이지 접속');
  res.render('signUp.ejs');
})


