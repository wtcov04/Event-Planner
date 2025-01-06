var express = require("express");
var router = express.Router();
router.use((req, res, next) => {
  res.locals.user = req.user;
  next();
});
const guard = (req, res, next) => {
  if (!req.user) {
    res.redirect("https://doc.gold.ac.uk/usr/465/login?error=session_expired");
  }
  next();
};

const shopData = { shopName: "Event App" };
// Handle our routes
router.get("/", function (req, res) {
  res.render("index.ejs", shopData);
});
router.get("/login", (req, res) => {
  res.render("login.ejs", shopData);
});
router.get("/register", (req, res) => {
  res.render("register.ejs", shopData);
});
router.get("/forgot-password", function (req, res) {
  res.render("forgot.ejs", shopData);
});
router.get("/my", guard, (req, res) => {
  const getMyEventQuery =
    "select * from event where event_id in (select event_id from participant where user_name=?)";
  db.query(getMyEventQuery, [req.user.user_name], (err, results) => {
    if (err) console.log(err);
    res.render("my", {
      shopName: shopData.shopName,
      myEvent: results,
      formatFunc: (date) => {
        date = new Date(date);
        var year = date.getFullYear().toString().slice(-2);
        var month = ("0" + (date.getMonth() + 1)).slice(-2);
        var day = ("0" + date.getDate()).slice(-2);
        return year + "." + month + "." + day;
      },
    });
  });
});
router.get("/my/update", guard, (req, res) => {
  res.render("my-update", shopData);
});
router.post("/my/update", guard, (req, res) => {
  const { username, introduce } = req.body;
  const updateQuery = "update user set introduce=? where user_name=?";
  db.query(updateQuery, [introduce, username], (err, result) => {
    if (err) console.log(err);
    res.redirect("https://doc.gold.ac.uk/usr/465/my");
  });
});

router.get("/post/add", guard, (req, res) => {
  res.render("add-post.ejs", shopData);
});

router.post("/forgot", (req, res) => {
  const { username, sentence } = req.body;
  const sentenceQuery =
    "select password_sentence,origin_pwd from user where user_name=?";
  db.query(sentenceQuery, [username], (err, result) => {
    console.log(err);
    console.log(result);
    if (err) {
      console.log(err);
    }
    if (result.length > 0) {
      result[0].password_sentence == sentence
        ? (isEqual = true)
        : (isEqual = false);
      if (isEqual) {
        res.redirect(
          `https://doc.gold.ac.uk/usr/465/forgot-password?pwd=${result[0].origin_pwd}`
        );
      } else {
        res.redirect(
          "https://doc.gold.ac.uk/usr/465/forgot-password?error=wrong-date"
        );
      }
    } else {
      res.redirect(
        "https://doc.gold.ac.uk/usr/465/forgot-password?error=not-found-id"
      );
    }
  });
});

router.post("/post/add", guard, (req, res) => {
  const { username, title, description, limit_participant, place, held_at } =
    req.body;
  console.log(req.body);
  const createPostQuery =
    "INSERT INTO event (title, description, user_name,limit_participant,place,held_at) VALUES (?, ?, ?,?,?,?)";
  db.query(
    createPostQuery,
    [title, description, username, limit_participant, place, held_at],
    (err, results) => {
      if (err) {
        console.log(err);
      } else {
        const insertParticipantQuery =
          "insert into participant (user_name,event_id) values (?,?)";
        db.query(
          insertParticipantQuery,
          [username, results.insertId],
          (err) => {
            if (err) {
              console.log(err);
            }
          }
        );

        res.status(201).redirect("https://doc.gold.ac.uk/usr/465/post");
      }
    }
  );
});
router.post("/apply/delete/:id", guard, (req, res) => {
  const deleteParticipantQuery =
    "delete from participant where event_id =? and user_name=?";
  db.query(
    deleteParticipantQuery,
    [req.params.id, req.body.username],
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.redirect(`https://doc.gold.ac.uk/usr/465/post/${req.params.id}`);
      }
    }
  );
});
router.post("/participant/delete/:id", guard, (req, res) => {
  if (req.body.username == req.user.user_name) {
    res.redirect(
      `https://doc.gold.ac.uk/usr/465/post/update/${req.params.id}?error=Event-Holder-cannot-be-deleted`
    );
  } else {
    const userExistQuery =
      "select * from participant where event_id =? and user_name=?";
    db.query(
      userExistQuery,
      [req.params.id, req.body.username],
      (err, result1) => {
        if (result1.length < 1) {
          res.redirect(
            `https://doc.gold.ac.uk/usr/465/post/update/${req.params.id}?error=User-Not_Exist-In-Event`
          );
        } else {
          const deleteParticipantQuery =
            "delete from participant where event_id =? and user_name=?";
          db.query(
            deleteParticipantQuery,
            [req.params.id, req.body.username],
            (err, result) => {
              if (err) {
                console.log(err);
              } else {
                res.redirect(
                  `https://doc.gold.ac.uk/usr/465/post/update/${req.params.id}`
                );
              }
            }
          );
        }
      }
    );
  }
});
router.post("/participant/:id", guard, (req, res) => {
  const createParticipantQuery =
    "insert into participant (user_name,event_id) values (?,?)";
  db.query(
    createParticipantQuery,
    [req.body.username, req.params.id],
    (err, results) => {
      if (err) {
        console.log(err);
      } else {
        res.redirect(`https://doc.gold.ac.uk/usr/465/post/${req.params.id}`);
      }
    }
  );
});
router.get("/post", guard, function (req, res) {
  let sort = (req.query?.sort || "created_at") + " DESC";
  if (sort == "held_at DESC") {
    sort = "held_at";
  }
  const getPostsQuery = `
  SELECT * from event order by ${sort}
  `;
  console.log(getPostsQuery);
  db.query(getPostsQuery, (err, results) => {
    if (err) {
      console.log(err);
    } else {
      res.render("post-list", {
        posts: results,
        shopName: shopData.shopName,
        formatFunc: (date) => {
          date = new Date(date);
          var year = date.getFullYear().toString().slice(-2);
          var month = ("0" + (date.getMonth() + 1)).slice(-2);
          var day = ("0" + date.getDate()).slice(-2);
          return year + "." + month + "." + day;
        },
      });
    }
  });
});

router.get("/post/update/:id", guard, (req, res) => {
  const getPostQuery = `select * from event where event_id=? `;
  db.query(getPostQuery, [req.params.id], (err, results) => {
    if (err) {
      console.log(err);
      res.send(`can not get data : ${err.message}`);
    }
    const getParticipantQuery =
      "select user_name from participant where event_id=?";
    arr = [];
    db.query(getParticipantQuery, [req.params.id], (err, result) => {
      if (err) console.log(err);
      for (let i of result) {
        arr.push(i.user_name);
      }
      res.render("update", {
        event: results[0],
        partList: arr,
        shopName: shopData.shopName,
      });
    });
  });
});

router.post("/post/update/:id", guard, (req, res) => {
  const { title, description, place, held_at } = req.body;
  const updatePostQuery =
    "update event set title=?, description=? ,place=? ,held_at=? where event_id=?";
  db.query(
    updatePostQuery,
    [title, description, place, held_at, Number(req.params.id)],
    (err, result) => {
      if (err) console.log(err);
      res.redirect(`https://doc.gold.ac.uk/usr/465/post/${req.params.id}`);
    }
  );
});

router.get("/post/:id", function (req, res) {
  const getPostQuery = `select * from event where event_id=? `;
  db.query(getPostQuery, [req.params.id], (err, results) => {
    if (err) {
      console.log(err);
      res.send(`can not get data : ${err.message}`);
    } else {
      const updateViewQuery = "update event set view_count=? where event_id=?";
      db.query(
        updateViewQuery,
        [results[0].view_count + 1, results[0].event_id],
        (err) => {
          if (err) {
            console.log(err);
            res.send(`can not update viweCount : ${err.message}`);
          }
        }
      );
      const getParticipantQuery =
        "select user_name from participant where event_id=?";
      arr = [];
      db.query(getParticipantQuery, [req.params.id], (err, result) => {
        if (err) console.log(err);
        let isPart = false;
        for (let i of result) {
          arr.push(i.user_name);
        }
        if (arr.includes(req.user.user_name)) isPart = true;
        res.render("post-detail", {
          post: results[0],
          isPart,
          partList: arr,
          shopName: shopData.shopName,
        });
      });
    }
  });

  router.post("/post/delete/:id", function (req, res) {
    console.log(req.params);
    const deleteQuery = "delete from event where event_id=?";
    db.query(deleteQuery, Number(req.params.id), (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.redirect("https://doc.gold.ac.uk/usr/465/post");
      }
    });
  });
});
module.exports = router;
