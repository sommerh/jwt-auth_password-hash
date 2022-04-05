const express = require('express');
const app = express();
app.use(express.json());
const {
  models: { User, Note },
} = require('./db');
const path = require('path');

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

app.post('/api/auth', async (req, res, next) => {
  try {
    res.send({ token: await User.authenticate(req.body) });
  } catch (ex) {
    next(ex);
  }
});

app.get('/api/auth', async (req, res, next) => {
  try {
    res.send(await User.byToken(req.headers.authorization));
    console.log(req.headers.authorization);
  } catch (ex) {
    next(ex);
  }
});

//We're on Securing the Route
// app.use('/api', async (req, res, next) => {
//   const user = await User.byToken(req.headers.authorization);
//   const id = req.params.id;

//   if(user.id === id){
//     next();
//   } else {
//     res.status(403).send("Not your todos, hacker!!!")
//   }
// })

app.get("/api/users/:id/notes", async (req, res, next) => {
  try {
    const id = req.params.id;

    const notes = await Note.findAll({
      where: {
        userId: id
      }
    })
    res.send(notes);
  } catch (error) {
    next(error);
  }
})

app.use((err, req, res, next) => {
  console.log(err);
  res.status(err.status || 500).send({ error: err.message });
});

module.exports = app;
