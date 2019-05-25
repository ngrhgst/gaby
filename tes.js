const Client = require('instagram-private-api').V1;
const delay = require('delay');
const chalk = require('chalk');
const _ = require('lodash');
const rp = require('request-promise');
const S = require('string');
const inquirer = require('inquirer');
var fs = require('fs'),
    request = require('request');
  
const User = [
{
  type:'input',
  name:'username',
  message:'[>] Insert Username:',
  validate: function(value){
    if(!value) return 'Can\'t Empty';
    return true;
  }
},
{
  type:'password',
  name:'password',
  message:'[>] Insert Password:',
  mask:'*',
  validate: function(value){
    if(!value) return 'Can\'t Empty';
    return true;
  }
},
{
  type:'input',
  name:'target',
  message:'[>] Insert Username Target (Without @[at]):',
  validate: function(value){
    if(!value) return 'Can\'t Empty';
    return true;
  }
},
{
  type:'input',
  name:'mysyntx',
  message:'[>] Input Total of Target You Want (ITTYW):',
  validate: function(value){
    value = value.match(/[0-9]/);
    if (value) return true;
    return 'Use Number Only!';
  }
},
{
  type:'input',
  name:'sleep',
  message:'[>] Insert Sleep (MiliSeconds):',
  validate: function(value){
    value = value.match(/[0-9]/);
    if (value) return true;
    return 'Delay is number';
  }
}
]

const Login = async function(User){

  const Device = new Client.Device(User.username);
  const Storage = new Client.CookieMemoryStorage();
  const session = new Client.Session(Device, Storage);

  try {
    await Client.Session.create(Device, Storage, User.username, User.password)
    const account = await session.getAccount();
    return Promise.resolve({session,account});
  } catch (err) {
    return Promise.reject(err);
  }

}

const Target = async function(username){
  const url = 'https://www.instagram.com/'+username+'/'
  const option = {
    url: url,
    method: 'GET'
  }
  try{
    const account = await rp(option);
    const data = S(account).between('<script type="text/javascript">window._sharedData = ', ';</script>').s
    const json = JSON.parse(data);
    if (json.entry_data.ProfilePage[0].graphql.user.is_private) {
      return Promise.reject('Target is private Account');
    } else {
      const id = json.entry_data.ProfilePage[0].graphql.user.id;
      const followers = json.entry_data.ProfilePage[0].graphql.user.edge_followed_by.count;
      return Promise.resolve({id,followers});
    }
  } catch (err){
    return Promise.reject(err);
  }

}

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

async function ngefollow(session,accountId){
  try {
    await Client.Relationship.create(session, accountId);
    return true
  } catch (e) {
    return false
  }
}

async function ngeComment(session, id, text){
  try {
    await Client.Comment.create(session, id, text);
    return true;
  } catch(e){
    return false;
  }
}

async function ngeLike(session, id){
  try{
    await Client.Like.create(session, id)
    return true;
  } catch(e) {
    return false;
  }
}

async function ngeDM(session, users, text){
    try{
    await Client.Thread.configureText(session, users, text)
        return true;
  } catch(e) {
        return false;
  }
}

async function ngeDMPhoto(session, users, text){
    try{
    await Client.Thread.configurePhoto(doLogin.session, akun.id, text);
        return true;
  } catch(e) {
        return false;
  }
}



const CommentLikeDM = async function(session, accountId, text){
  var result;

  const feed = new Client.Feed.UserMedia(session, accountId);
    const task = [
  ngeDM(session, accountId, text),
  ngeDMPhoto(session, accountId, text)
    ]
    const [DM] = await Promise.all(task);
  const printDM = DM ? chalk`{green DM}` : chalk`{red DM}`;
  const printDMPhoto = Photo ? chalk`{green Photo}` : chalk`{red Photo}`;
    return chalk`{bold.green ${printDM},${printDMPhoto} [${text}]}`;

};

const Followers = async function(session, id){
  const feed = new Client.Feed.AccountFollowers(session, id);
  try{
    const Pollowers = [];
    var cursor;
    do {
      if (cursor) feed.setCursor(cursor);
      const getPollowers = await feed.get();
      await Promise.all(getPollowers.map(async(akun) => {
        Pollowers.push(akun.id);
      }))
      cursor = await feed.getCursor();
    } while(feed.isMoreAvailable());
    return Promise.resolve(Pollowers);
  } catch(err){
    return Promise.reject(err);
  }
}

const Excute = async function(User, TargetUsername, Sleep, mysyntx){
  try {
    console.log(chalk`{yellow \n [?] Try to Login . . .}`)
    const doLogin = await Login(User);
    console.log(chalk`{green  [!] Login Success, }{yellow [?] Try To Get ID & Followers Target . . .}`)
    const getTarget = await Target(TargetUsername);
    console.log(chalk`{green  [!] ${TargetUsername}: [${getTarget.id}] | Followers: [${getTarget.followers}]}`)
    const getFollowers = await Followers(doLogin. session, doLogin.account.id)
    console.log(chalk`{cyan  [?] Try to Direct Message Followers Target . . . \n}`)
    const Targetfeed = new Client.Feed.AccountFollowers(doLogin.session, getTarget.id);
    var TargetCursor;
    do {
      if (TargetCursor) Targetfeed.setCursor(TargetCursor);
      var TargetResult = await Targetfeed.get();
      TargetResult = _.chunk(TargetResult, mysyntx);
      for (let i = 0; i < TargetResult.length; i++) {
        var timeNow = new Date();
        timeNow = `${timeNow.getHours()}:${timeNow.getMinutes()}:${timeNow.getSeconds()}`
        await Promise.all(TargetResult[i].map(async(akun) => {
          if (!getFollowers.includes(akun.id)) {
            var Text = fs.readFileSync('komen.txt', 'utf8').split('|');
            var Text2 = fs.readFileSync('image.txt', 'utf8').split('|');
            var ranText = Text[Math.floor(Math.random() * Text.length)];

            var ranText2 = Text2[Math.floor(Math.random() * Text2.length)];
          const upload =  await Client.Upload.photo(doLogin.session, ranText2)

          Client.Thread.configurePhoto(doLogin.session, akun.id, upload.params.uploadId);
          Client.Thread.configureText(doLogin.session, akun.id, ranText);
          console.log(chalk`[{magenta ${timeNow}}] {bold.green [>]}${akun.params.username}`)
          } else {
            console.log(chalk`[{magenta ${timeNow}}] {bold.yellow [SKIP]}${akun.params.username} => ALREADY FOLLOWED`)
          }
        }));
        console.log(chalk`{yellow \n [#][>] Delay For ${Sleep} MiliSeconds [<][#] \n}`);
        await delay(Sleep);
      }
      TargetCursor = await Targetfeed.getCursor();
      console.log(chalk`{yellow \n [#][>] Delay For ${Sleep} MiliSeconds [<][#] \n}`);
      await delay(Sleep);
    } while(Targetfeed.isMoreAvailable());
  } catch (err) {
    console.log(err);
  }
}

console.log(chalk`
  {bold.cyan
  —————————————————— [INFORMATION] ————————————————————

  [?] {bold.green Using Account/User Target!}
  [?] {bold.green Direct Message Followers Target}
  [?] {bold.green Gunakan komen.txt untk komen!}

  —————————————————————————————————————————————————————
  What's new?
  1. Input Target/delay Manual (ITTYW)
  —————————————————————————————————————————————————————}
      `);
//ikiganteng
inquirer.prompt(User)
.then(answers => {
  Excute({
    username:answers.username,
    password:answers.password
  },answers.target,answers.sleep,answers.mysyntx);
})