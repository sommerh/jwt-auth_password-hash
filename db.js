const Sequelize = require('sequelize');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { STRING } = Sequelize;
const config = {
  logging: false,
};

if (process.env.LOGGING) {
  delete config.logging;
}
const conn = new Sequelize(
  process.env.DATABASE_URL || 'postgres://localhost/acme_db',
  config
);

const User = conn.define('user', {
  username: STRING,
  password: STRING,
});

const Note = conn.define('note', {
  text: STRING
})

Note.belongsTo(User);
User.hasMany(Note);

User.byToken = async (token) => {
  try {
    const verify = jwt.verify(token, process.env.JWT);
    const user = await User.findByPk(verify.userId);

    if (user) {
      return user;
    }
    const error = Error('bad credentials');
    error.status = 401;
    throw error;
  } catch (ex) {
    const error = Error('bad credentials');
    error.status = 401;
    throw error;
  }
};


User.authenticate = async ({ username, password }) => {

  const user = await User.findOne({
    where: {
      username,
    },
  });

  const matched = await bcrypt.compare(password, user.password);

  if (matched) {
    return jwt.sign({ userId: user.id }, process.env.JWT, { expiresIn: '1h' });
  }
  const error = Error('bad credentials');
  error.status = 401;
  throw error;
};

User.beforeCreate(async (user) => {
  const saltRounds = 10;
  const plainPassword = user.password;

  const hash = await bcrypt.hash(plainPassword, saltRounds)
  user.password = hash;
})

const syncAndSeed = async () => {
  await conn.sync({ force: true });
  const credentials = [
    { username: 'lucy', password: 'lucy_pw' },
    { username: 'moe', password: 'moe_pw' },
    { username: 'larry', password: 'larry_pw' },
  ];

  const notes = [
    {text: "a quick brown fox", userId: 1},
    {text: "hfioqifhioqe", userId: 2},
    {text: "hiiiiiiiiiii", userId: 2}
  ]
  const [lucy, moe, larry] = await Promise.all(
    credentials.map((credential) => User.create(credential))
  );
  const [note1, note2, note3] = await Promise.all(
    notes.map((note) => {
      Note.create(note);
    })
  );

  return {
    users: {
      lucy,
      moe,
      larry,
    },
    notes: {
      note1,
      note2,
      note3
    }
  };
};

module.exports = {
  syncAndSeed,
  models: {
    User,
    Note
  },
};
